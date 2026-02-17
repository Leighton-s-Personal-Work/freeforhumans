// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title IWorldID
/// @notice Interface for the World ID Router contract
interface IWorldID {
    /// @notice Verifies a World ID proof
    /// @param root The root of the Merkle tree
    /// @param groupId The group ID (1 = Orb, 2 = NFC)
    /// @param signalHash Hash of the signal (recipient address)
    /// @param nullifierHash The nullifier hash for this proof
    /// @param externalNullifierHash Hash of the external nullifier
    /// @param proof The zero-knowledge proof
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

/// @title FreeForHumans
/// @notice A marketplace where verified humans claim free ERC-20 tokens
/// @dev Uses World ID for sybil-resistant proof-of-personhood verification
contract FreeForHumans is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Campaign {
        uint256 id;
        address creator;
        address token;
        uint256 orbClaimAmount;
        uint256 nfcClaimAmount;
        uint256 totalBudget;
        uint256 totalClaimed;
        uint256 expiresAt;
        bool isRecurring;
        uint256 claimInterval;
        bool isActive;
        string title;
        string description;
        string imageUrl;
    }

    // ============ State Variables ============

    /// @notice World ID Router contract
    IWorldID public immutable worldIdRouter;

    /// @notice World App ID for external nullifier calculation
    uint256 public immutable appId;

    /// @notice Address authorized to submit claims on behalf of users
    address public relayer;

    /// @notice Counter for campaign IDs
    uint256 public nextCampaignId;

    /// @notice All campaigns indexed by ID
    mapping(uint256 => Campaign) public campaigns;

    /// @notice Addresses allowed to create campaigns
    mapping(address => bool) public whitelistedCreators;

    /// @notice For one-time claims: nullifierHash => campaignId => groupId => bool
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) public hasClaimed;

    /// @notice For recurring claims: nullifierHash => campaignId => groupId => lastClaimTimestamp
    mapping(uint256 => mapping(uint256 => mapping(uint256 => uint256))) public lastClaimTime;

    // ============ Events ============

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        address indexed token,
        uint256 orbClaimAmount,
        uint256 nfcClaimAmount,
        uint256 totalBudget,
        uint256 expiresAt,
        bool isRecurring,
        uint256 claimInterval,
        string title
    );

    event CampaignCancelled(uint256 indexed campaignId, uint256 tokensReturned);

    event TokensClaimed(
        uint256 indexed campaignId,
        address indexed recipient,
        uint256 amount,
        uint256 groupId,
        uint256 nullifierHash
    );

    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);

    event CreatorWhitelistUpdated(address indexed creator, bool status);

    // ============ Errors ============

    error NotWhitelisted();
    error InvalidToken();
    error InvalidBudget();
    error InvalidExpiry();
    error InvalidClaimAmounts();
    error InvalidRecurringConfig();
    error CampaignNotFound();
    error CampaignNotActive();
    error CampaignExpired();
    error InsufficientBudget();
    error NotCampaignCreatorOrOwner();
    error InvalidGroupId();
    error AlreadyClaimed();
    error ClaimIntervalNotPassed();
    error OnlyRelayer();
    error ZeroAddress();

    // ============ Modifiers ============

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert OnlyRelayer();
        _;
    }

    modifier onlyWhitelisted() {
        if (!whitelistedCreators[msg.sender]) revert NotWhitelisted();
        _;
    }

    // ============ Constructor ============

    /// @notice Initializes the FreeForHumans contract
    /// @param _worldIdRouter Address of the World ID Router contract
    /// @param _appId The World App ID (used for external nullifier calculation)
    /// @param _relayer Initial relayer address
    constructor(
        address _worldIdRouter,
        uint256 _appId,
        address _relayer
    ) Ownable(msg.sender) {
        if (_worldIdRouter == address(0)) revert ZeroAddress();
        if (_relayer == address(0)) revert ZeroAddress();
        
        worldIdRouter = IWorldID(_worldIdRouter);
        appId = _appId;
        relayer = _relayer;
    }

    // ============ Campaign Management ============

    /// @notice Creates a new campaign
    /// @dev Creator must have approved token transfer before calling
    /// @param token The ERC-20 token address to distribute
    /// @param orbClaimAmount Amount per claim for Orb-verified humans
    /// @param nfcClaimAmount Amount per claim for NFC-verified humans
    /// @param totalBudget Total tokens to deposit
    /// @param expiresAt Unix timestamp when campaign expires
    /// @param isRecurring Whether humans can claim more than once
    /// @param claimInterval Minimum seconds between claims (0 if one-time)
    /// @param title Campaign display name
    /// @param description Campaign description
    /// @param imageUrl Campaign image/logo URL
    /// @return campaignId The ID of the created campaign
    function createCampaign(
        address token,
        uint256 orbClaimAmount,
        uint256 nfcClaimAmount,
        uint256 totalBudget,
        uint256 expiresAt,
        bool isRecurring,
        uint256 claimInterval,
        string calldata title,
        string calldata description,
        string calldata imageUrl
    ) external onlyWhitelisted whenNotPaused returns (uint256 campaignId) {
        // Validation
        if (token == address(0)) revert InvalidToken();
        if (totalBudget == 0) revert InvalidBudget();
        if (expiresAt <= block.timestamp) revert InvalidExpiry();
        if (orbClaimAmount == 0 && nfcClaimAmount == 0) revert InvalidClaimAmounts();
        if (isRecurring && claimInterval == 0) revert InvalidRecurringConfig();
        if (!isRecurring && claimInterval != 0) revert InvalidRecurringConfig();

        campaignId = nextCampaignId++;

        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: msg.sender,
            token: token,
            orbClaimAmount: orbClaimAmount,
            nfcClaimAmount: nfcClaimAmount,
            totalBudget: totalBudget,
            totalClaimed: 0,
            expiresAt: expiresAt,
            isRecurring: isRecurring,
            claimInterval: claimInterval,
            isActive: true,
            title: title,
            description: description,
            imageUrl: imageUrl
        });

        // Transfer tokens from creator to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalBudget);

        emit CampaignCreated(
            campaignId,
            msg.sender,
            token,
            orbClaimAmount,
            nfcClaimAmount,
            totalBudget,
            expiresAt,
            isRecurring,
            claimInterval,
            title
        );
    }

    /// @notice Cancels a campaign and returns remaining tokens to creator
    /// @param campaignId The ID of the campaign to cancel
    function cancelCampaign(uint256 campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[campaignId];
        
        if (campaign.creator == address(0)) revert CampaignNotFound();
        if (msg.sender != campaign.creator && msg.sender != owner()) {
            revert NotCampaignCreatorOrOwner();
        }
        if (!campaign.isActive) revert CampaignNotActive();

        // Effects
        campaign.isActive = false;
        uint256 tokensToReturn = campaign.totalBudget - campaign.totalClaimed;

        // Interactions
        if (tokensToReturn > 0) {
            IERC20(campaign.token).safeTransfer(campaign.creator, tokensToReturn);
        }

        emit CampaignCancelled(campaignId, tokensToReturn);
    }

    // ============ Claiming ============

    /// @notice Claims tokens from a campaign with World ID verification
    /// @dev Called by relayer on behalf of users
    /// @param campaignId The campaign to claim from
    /// @param recipient Where to send tokens
    /// @param root Merkle root from IDKit
    /// @param nullifierHash Nullifier hash from IDKit
    /// @param proof Zero-knowledge proof from IDKit
    /// @param groupId Verification level (1 = Orb, 2 = NFC)
    function claim(
        uint256 campaignId,
        address recipient,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof,
        uint256 groupId
    ) external onlyRelayer whenNotPaused nonReentrant {
        // Validate groupId
        if (groupId != 1 && groupId != 2) revert InvalidGroupId();

        Campaign storage campaign = campaigns[campaignId];
        
        // Campaign validation
        if (campaign.creator == address(0)) revert CampaignNotFound();
        if (!campaign.isActive) revert CampaignNotActive();
        if (block.timestamp >= campaign.expiresAt) revert CampaignExpired();

        // Determine claim amount based on verification level
        uint256 claimAmount = groupId == 1 ? campaign.orbClaimAmount : campaign.nfcClaimAmount;
        
        // Check if this verification level is supported for this campaign
        if (claimAmount == 0) revert InvalidClaimAmounts();

        // Check remaining budget
        if (campaign.totalClaimed + claimAmount > campaign.totalBudget) {
            revert InsufficientBudget();
        }

        // Check claim eligibility (per groupId to prevent cross-type replay)
        if (campaign.isRecurring) {
            uint256 lastClaim = lastClaimTime[nullifierHash][campaignId][groupId];
            if (lastClaim != 0 && block.timestamp < lastClaim + campaign.claimInterval) {
                revert ClaimIntervalNotPassed();
            }
        } else {
            if (hasClaimed[nullifierHash][campaignId][groupId]) {
                revert AlreadyClaimed();
            }
        }

        // Verify the World ID proof
        // External nullifier incorporates app_id and campaign_id for uniqueness
        uint256 externalNullifierHash = _hashExternalNullifier(campaignId);
        
        worldIdRouter.verifyProof(
            root,
            groupId,
            _hashSignal(recipient),
            nullifierHash,
            externalNullifierHash,
            proof
        );

        // Effects - update claim tracking
        if (campaign.isRecurring) {
            lastClaimTime[nullifierHash][campaignId][groupId] = block.timestamp;
        } else {
            hasClaimed[nullifierHash][campaignId][groupId] = true;
        }
        campaign.totalClaimed += claimAmount;

        // Interactions - transfer tokens
        IERC20(campaign.token).safeTransfer(recipient, claimAmount);

        emit TokensClaimed(campaignId, recipient, claimAmount, groupId, nullifierHash);
    }

    // ============ Admin Functions ============

    /// @notice Updates the relayer address
    /// @param _relayer New relayer address
    function setRelayer(address _relayer) external onlyOwner {
        if (_relayer == address(0)) revert ZeroAddress();
        
        address oldRelayer = relayer;
        relayer = _relayer;
        
        emit RelayerUpdated(oldRelayer, _relayer);
    }

    /// @notice Updates creator whitelist status
    /// @param creator Address to update
    /// @param status Whether to whitelist or delist
    function whitelistCreator(address creator, bool status) external onlyOwner {
        if (creator == address(0)) revert ZeroAddress();
        
        whitelistedCreators[creator] = status;
        
        emit CreatorWhitelistUpdated(creator, status);
    }

    /// @notice Pauses the contract
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses the contract
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ View Functions ============

    /// @notice Gets full campaign details
    /// @param campaignId The campaign ID
    /// @return Campaign struct with all details
    function getCampaign(uint256 campaignId) external view returns (Campaign memory) {
        return campaigns[campaignId];
    }

    /// @notice Gets remaining budget for a campaign
    /// @param campaignId The campaign ID
    /// @return Remaining tokens available for claims
    function getRemainingBudget(uint256 campaignId) external view returns (uint256) {
        Campaign storage campaign = campaigns[campaignId];
        return campaign.totalBudget - campaign.totalClaimed;
    }

    /// @notice Checks if a nullifier can claim from a campaign
    /// @param nullifierHash The nullifier hash to check
    /// @param campaignId The campaign ID
    /// @param groupId The verification group (1 = Orb, 2 = NFC)
    /// @return eligible Whether the nullifier can claim
    /// @return nextClaimTime For recurring: timestamp when next claim is available (0 if now)
    function canClaim(
        uint256 nullifierHash,
        uint256 campaignId,
        uint256 groupId
    ) external view returns (bool eligible, uint256 nextClaimTime) {
        Campaign storage campaign = campaigns[campaignId];
        
        if (!campaign.isActive || block.timestamp >= campaign.expiresAt) {
            return (false, 0);
        }

        uint256 claimAmount = groupId == 1 ? campaign.orbClaimAmount : campaign.nfcClaimAmount;
        if (claimAmount == 0 || campaign.totalClaimed + claimAmount > campaign.totalBudget) {
            return (false, 0);
        }

        if (campaign.isRecurring) {
            uint256 lastClaim = lastClaimTime[nullifierHash][campaignId][groupId];
            if (lastClaim == 0) {
                return (true, 0);
            }
            nextClaimTime = lastClaim + campaign.claimInterval;
            eligible = block.timestamp >= nextClaimTime;
            if (eligible) {
                nextClaimTime = 0;
            }
        } else {
            eligible = !hasClaimed[nullifierHash][campaignId][groupId];
        }
    }

    // ============ Internal Functions ============

    /// @dev Computes the external nullifier hash for a campaign
    /// @param campaignId The campaign ID
    /// @return The external nullifier hash
    function _hashExternalNullifier(uint256 campaignId) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(appId, campaignId)));
    }

    /// @dev Computes the signal hash for an address
    /// @param signal The signal (recipient address)
    /// @return The signal hash
    function _hashSignal(address signal) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(signal)));
    }
}
