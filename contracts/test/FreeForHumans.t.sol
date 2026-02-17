// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FreeForHumans.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title MockERC20
/// @notice Simple ERC20 token for testing
contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/// @title MockWorldID
/// @notice Mock World ID Router for testing
contract MockWorldID {
    bool public shouldRevert;
    string public revertReason;

    function setRevert(bool _shouldRevert, string memory _reason) external {
        shouldRevert = _shouldRevert;
        revertReason = _reason;
    }

    function verifyProof(
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256[8] calldata
    ) external view {
        if (shouldRevert) {
            revert(revertReason);
        }
    }
}

/// @title FreeForHumansTest
/// @notice Comprehensive test suite for FreeForHumans contract
contract FreeForHumansTest is Test {
    FreeForHumans public freeForHumans;
    MockWorldID public worldId;
    MockERC20 public token;

    address public owner = address(this);
    address public relayer = address(0x1);
    address public creator = address(0x2);
    address public recipient = address(0x3);
    address public nonWhitelisted = address(0x4);

    uint256 public constant APP_ID = 12345;
    uint256 public constant ORB_CLAIM_AMOUNT = 100 ether;
    uint256 public constant NFC_CLAIM_AMOUNT = 50 ether;
    uint256 public constant TOTAL_BUDGET = 10000 ether;
    uint256 public constant ONE_DAY = 86400;
    uint256 public constant ONE_WEEK = 604800;

    // World ID proof parameters (mocked)
    uint256 public constant ROOT = 1;
    uint256 public constant NULLIFIER_HASH = 123456789;
    uint256[8] public proof = [uint256(1), 2, 3, 4, 5, 6, 7, 8];

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

    function setUp() public {
        worldId = new MockWorldID();
        token = new MockERC20("Test Token", "TEST");
        freeForHumans = new FreeForHumans(address(worldId), APP_ID, relayer);

        // Whitelist the creator
        freeForHumans.whitelistCreator(creator, true);

        // Mint tokens to creator
        token.mint(creator, TOTAL_BUDGET * 10);
    }

    // ============ Constructor Tests ============

    function test_constructor_setsCorrectValues() public view {
        assertEq(address(freeForHumans.worldIdRouter()), address(worldId));
        assertEq(freeForHumans.appId(), APP_ID);
        assertEq(freeForHumans.relayer(), relayer);
        assertEq(freeForHumans.owner(), owner);
    }

    function test_constructor_revertsWithZeroWorldId() public {
        vm.expectRevert(FreeForHumans.ZeroAddress.selector);
        new FreeForHumans(address(0), APP_ID, relayer);
    }

    function test_constructor_revertsWithZeroRelayer() public {
        vm.expectRevert(FreeForHumans.ZeroAddress.selector);
        new FreeForHumans(address(worldId), APP_ID, address(0));
    }

    // ============ Campaign Creation Tests ============

    function test_createCampaign_success() public {
        uint256 expiresAt = block.timestamp + ONE_WEEK;

        vm.startPrank(creator);
        token.approve(address(freeForHumans), TOTAL_BUDGET);

        vm.expectEmit(true, true, true, true);
        emit CampaignCreated(
            0, creator, address(token), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT,
            TOTAL_BUDGET, expiresAt, false, 0, "Test Campaign"
        );

        uint256 campaignId = freeForHumans.createCampaign(
            address(token),
            ORB_CLAIM_AMOUNT,
            NFC_CLAIM_AMOUNT,
            TOTAL_BUDGET,
            expiresAt,
            false,
            0,
            "Test Campaign",
            "A test campaign",
            "https://example.com/image.png"
        );
        vm.stopPrank();

        assertEq(campaignId, 0);
        assertEq(token.balanceOf(address(freeForHumans)), TOTAL_BUDGET);

        FreeForHumans.Campaign memory campaign = freeForHumans.getCampaign(0);
        assertEq(campaign.creator, creator);
        assertEq(campaign.token, address(token));
        assertEq(campaign.orbClaimAmount, ORB_CLAIM_AMOUNT);
        assertEq(campaign.nfcClaimAmount, NFC_CLAIM_AMOUNT);
        assertEq(campaign.totalBudget, TOTAL_BUDGET);
        assertEq(campaign.totalClaimed, 0);
        assertEq(campaign.expiresAt, expiresAt);
        assertFalse(campaign.isRecurring);
        assertEq(campaign.claimInterval, 0);
        assertTrue(campaign.isActive);
        assertEq(campaign.title, "Test Campaign");
    }

    function test_createCampaign_recurringCampaign() public {
        uint256 expiresAt = block.timestamp + ONE_WEEK;

        vm.startPrank(creator);
        token.approve(address(freeForHumans), TOTAL_BUDGET);

        uint256 campaignId = freeForHumans.createCampaign(
            address(token),
            ORB_CLAIM_AMOUNT,
            NFC_CLAIM_AMOUNT,
            TOTAL_BUDGET,
            expiresAt,
            true,
            ONE_DAY,
            "Recurring Campaign",
            "Claims available daily",
            ""
        );
        vm.stopPrank();

        FreeForHumans.Campaign memory campaign = freeForHumans.getCampaign(campaignId);
        assertTrue(campaign.isRecurring);
        assertEq(campaign.claimInterval, ONE_DAY);
    }

    function test_createCampaign_revertsIfNotWhitelisted() public {
        vm.startPrank(nonWhitelisted);
        token.approve(address(freeForHumans), TOTAL_BUDGET);

        vm.expectRevert(FreeForHumans.NotWhitelisted.selector);
        freeForHumans.createCampaign(
            address(token), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT, TOTAL_BUDGET,
            block.timestamp + ONE_WEEK, false, 0, "Test", "", ""
        );
        vm.stopPrank();
    }

    function test_createCampaign_revertsWithZeroToken() public {
        vm.startPrank(creator);

        vm.expectRevert(FreeForHumans.InvalidToken.selector);
        freeForHumans.createCampaign(
            address(0), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT, TOTAL_BUDGET,
            block.timestamp + ONE_WEEK, false, 0, "Test", "", ""
        );
        vm.stopPrank();
    }

    function test_createCampaign_revertsWithZeroBudget() public {
        vm.startPrank(creator);

        vm.expectRevert(FreeForHumans.InvalidBudget.selector);
        freeForHumans.createCampaign(
            address(token), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT, 0,
            block.timestamp + ONE_WEEK, false, 0, "Test", "", ""
        );
        vm.stopPrank();
    }

    function test_createCampaign_revertsWithPastExpiry() public {
        vm.startPrank(creator);

        vm.expectRevert(FreeForHumans.InvalidExpiry.selector);
        freeForHumans.createCampaign(
            address(token), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT, TOTAL_BUDGET,
            block.timestamp - 1, false, 0, "Test", "", ""
        );
        vm.stopPrank();
    }

    function test_createCampaign_revertsWithZeroClaimAmounts() public {
        vm.startPrank(creator);

        vm.expectRevert(FreeForHumans.InvalidClaimAmounts.selector);
        freeForHumans.createCampaign(
            address(token), 0, 0, TOTAL_BUDGET,
            block.timestamp + ONE_WEEK, false, 0, "Test", "", ""
        );
        vm.stopPrank();
    }

    function test_createCampaign_revertsRecurringWithZeroInterval() public {
        vm.startPrank(creator);

        vm.expectRevert(FreeForHumans.InvalidRecurringConfig.selector);
        freeForHumans.createCampaign(
            address(token), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT, TOTAL_BUDGET,
            block.timestamp + ONE_WEEK, true, 0, "Test", "", ""
        );
        vm.stopPrank();
    }

    function test_createCampaign_revertsNonRecurringWithInterval() public {
        vm.startPrank(creator);

        vm.expectRevert(FreeForHumans.InvalidRecurringConfig.selector);
        freeForHumans.createCampaign(
            address(token), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT, TOTAL_BUDGET,
            block.timestamp + ONE_WEEK, false, ONE_DAY, "Test", "", ""
        );
        vm.stopPrank();
    }

    function test_createCampaign_revertsWhenPaused() public {
        freeForHumans.pause();

        vm.startPrank(creator);
        token.approve(address(freeForHumans), TOTAL_BUDGET);

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        freeForHumans.createCampaign(
            address(token), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT, TOTAL_BUDGET,
            block.timestamp + ONE_WEEK, false, 0, "Test", "", ""
        );
        vm.stopPrank();
    }

    // ============ Cancel Campaign Tests ============

    function test_cancelCampaign_byCreator() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit CampaignCancelled(campaignId, TOTAL_BUDGET);
        freeForHumans.cancelCampaign(campaignId);

        FreeForHumans.Campaign memory campaign = freeForHumans.getCampaign(campaignId);
        assertFalse(campaign.isActive);
        assertEq(token.balanceOf(creator), TOTAL_BUDGET * 10); // Back to original balance
    }

    function test_cancelCampaign_byOwner() public {
        uint256 campaignId = _createBasicCampaign();

        vm.expectEmit(true, false, false, true);
        emit CampaignCancelled(campaignId, TOTAL_BUDGET);
        freeForHumans.cancelCampaign(campaignId);

        FreeForHumans.Campaign memory campaign = freeForHumans.getCampaign(campaignId);
        assertFalse(campaign.isActive);
    }

    function test_cancelCampaign_returnsPartialBudget() public {
        uint256 campaignId = _createBasicCampaign();

        // Perform a claim first
        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        uint256 expectedReturn = TOTAL_BUDGET - ORB_CLAIM_AMOUNT;

        vm.prank(creator);
        vm.expectEmit(true, false, false, true);
        emit CampaignCancelled(campaignId, expectedReturn);
        freeForHumans.cancelCampaign(campaignId);

        assertEq(token.balanceOf(creator), TOTAL_BUDGET * 10 - ORB_CLAIM_AMOUNT);
    }

    function test_cancelCampaign_revertsIfNotCreatorOrOwner() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(nonWhitelisted);
        vm.expectRevert(FreeForHumans.NotCampaignCreatorOrOwner.selector);
        freeForHumans.cancelCampaign(campaignId);
    }

    function test_cancelCampaign_revertsIfNotFound() public {
        vm.expectRevert(FreeForHumans.CampaignNotFound.selector);
        freeForHumans.cancelCampaign(999);
    }

    function test_cancelCampaign_revertsIfAlreadyCancelled() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(creator);
        freeForHumans.cancelCampaign(campaignId);

        vm.prank(creator);
        vm.expectRevert(FreeForHumans.CampaignNotActive.selector);
        freeForHumans.cancelCampaign(campaignId);
    }

    // ============ Claim Tests - Orb (Group 1) ============

    function test_claim_orbSuccess() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(relayer);
        vm.expectEmit(true, true, false, true);
        emit TokensClaimed(campaignId, recipient, ORB_CLAIM_AMOUNT, 1, NULLIFIER_HASH);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        assertEq(token.balanceOf(recipient), ORB_CLAIM_AMOUNT);

        FreeForHumans.Campaign memory campaign = freeForHumans.getCampaign(campaignId);
        assertEq(campaign.totalClaimed, ORB_CLAIM_AMOUNT);
    }

    function test_claim_orbPreventsDoubleClaim() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.AlreadyClaimed.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);
    }

    // ============ Claim Tests - NFC (Group 2) ============

    function test_claim_nfcSuccess() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(relayer);
        vm.expectEmit(true, true, false, true);
        emit TokensClaimed(campaignId, recipient, NFC_CLAIM_AMOUNT, 2, NULLIFIER_HASH);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 2);

        assertEq(token.balanceOf(recipient), NFC_CLAIM_AMOUNT);
    }

    function test_claim_nfcPreventsDoubleClaim() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 2);

        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.AlreadyClaimed.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 2);
    }

    // ============ Claim Tests - Cross-Group ============

    function test_claim_canClaimBothOrbAndNfc() public {
        uint256 campaignId = _createBasicCampaign();

        // Same nullifier can claim as both Orb and NFC (different groupIds)
        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 2);

        assertEq(token.balanceOf(recipient), ORB_CLAIM_AMOUNT + NFC_CLAIM_AMOUNT);
    }

    // ============ Claim Tests - Invalid Group ID ============

    function test_claim_revertsInvalidGroupId() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.InvalidGroupId.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 0);

        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.InvalidGroupId.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 3);
    }

    // ============ Claim Tests - Campaign Validation ============

    function test_claim_revertsOnlyRelayer() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(nonWhitelisted);
        vm.expectRevert(FreeForHumans.OnlyRelayer.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);
    }

    function test_claim_revertsCampaignNotFound() public {
        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.CampaignNotFound.selector);
        freeForHumans.claim(999, recipient, ROOT, NULLIFIER_HASH, proof, 1);
    }

    function test_claim_revertsCampaignNotActive() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(creator);
        freeForHumans.cancelCampaign(campaignId);

        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.CampaignNotActive.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);
    }

    function test_claim_revertsCampaignExpired() public {
        uint256 campaignId = _createBasicCampaign();

        vm.warp(block.timestamp + ONE_WEEK + 1);

        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.CampaignExpired.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);
    }

    function test_claim_revertsInsufficientBudget() public {
        // Create campaign with small budget
        vm.startPrank(creator);
        token.approve(address(freeForHumans), ORB_CLAIM_AMOUNT);
        uint256 campaignId = freeForHumans.createCampaign(
            address(token), ORB_CLAIM_AMOUNT, NFC_CLAIM_AMOUNT, ORB_CLAIM_AMOUNT,
            block.timestamp + ONE_WEEK, false, 0, "Small", "", ""
        );
        vm.stopPrank();

        // First claim succeeds
        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        // Second claim fails
        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.InsufficientBudget.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH + 1, proof, 1);
    }

    function test_claim_revertsWhenPaused() public {
        uint256 campaignId = _createBasicCampaign();
        freeForHumans.pause();

        vm.prank(relayer);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);
    }

    function test_claim_revertsOnWorldIdFailure() public {
        uint256 campaignId = _createBasicCampaign();
        worldId.setRevert(true, "Invalid proof");

        vm.prank(relayer);
        vm.expectRevert("Invalid proof");
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);
    }

    // ============ Recurring Campaign Tests ============

    function test_claim_recurringFirstClaim() public {
        uint256 campaignId = _createRecurringCampaign();

        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        assertEq(token.balanceOf(recipient), ORB_CLAIM_AMOUNT);
    }

    function test_claim_recurringRespectsInterval() public {
        uint256 campaignId = _createRecurringCampaign();

        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        // Try to claim again immediately
        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.ClaimIntervalNotPassed.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        // Warp time forward
        vm.warp(block.timestamp + ONE_DAY);

        // Now should succeed
        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        assertEq(token.balanceOf(recipient), ORB_CLAIM_AMOUNT * 2);
    }

    function test_claim_recurringTracksSeparatelyByGroupId() public {
        uint256 campaignId = _createRecurringCampaign();

        // Claim as Orb
        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        // Should still be able to claim as NFC (different groupId)
        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 2);

        assertEq(token.balanceOf(recipient), ORB_CLAIM_AMOUNT + NFC_CLAIM_AMOUNT);
    }

    // ============ Orb-Only Campaign Tests ============

    function test_claim_orbOnlyCampaign() public {
        vm.startPrank(creator);
        token.approve(address(freeForHumans), TOTAL_BUDGET);
        uint256 campaignId = freeForHumans.createCampaign(
            address(token), ORB_CLAIM_AMOUNT, 0, TOTAL_BUDGET,
            block.timestamp + ONE_WEEK, false, 0, "Orb Only", "", ""
        );
        vm.stopPrank();

        // Orb claim succeeds
        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        // NFC claim fails
        vm.prank(relayer);
        vm.expectRevert(FreeForHumans.InvalidClaimAmounts.selector);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH + 1, proof, 2);
    }

    // ============ Admin Function Tests ============

    function test_setRelayer_success() public {
        address newRelayer = address(0x99);

        vm.expectEmit(true, true, false, false);
        emit RelayerUpdated(relayer, newRelayer);
        freeForHumans.setRelayer(newRelayer);

        assertEq(freeForHumans.relayer(), newRelayer);
    }

    function test_setRelayer_revertsNonOwner() public {
        vm.prank(nonWhitelisted);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonWhitelisted));
        freeForHumans.setRelayer(address(0x99));
    }

    function test_setRelayer_revertsZeroAddress() public {
        vm.expectRevert(FreeForHumans.ZeroAddress.selector);
        freeForHumans.setRelayer(address(0));
    }

    function test_whitelistCreator_success() public {
        address newCreator = address(0x88);

        vm.expectEmit(true, false, false, true);
        emit CreatorWhitelistUpdated(newCreator, true);
        freeForHumans.whitelistCreator(newCreator, true);

        assertTrue(freeForHumans.whitelistedCreators(newCreator));

        vm.expectEmit(true, false, false, true);
        emit CreatorWhitelistUpdated(newCreator, false);
        freeForHumans.whitelistCreator(newCreator, false);

        assertFalse(freeForHumans.whitelistedCreators(newCreator));
    }

    function test_whitelistCreator_revertsNonOwner() public {
        vm.prank(nonWhitelisted);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonWhitelisted));
        freeForHumans.whitelistCreator(address(0x88), true);
    }

    function test_whitelistCreator_revertsZeroAddress() public {
        vm.expectRevert(FreeForHumans.ZeroAddress.selector);
        freeForHumans.whitelistCreator(address(0), true);
    }

    function test_pause_unpause() public {
        freeForHumans.pause();
        assertTrue(freeForHumans.paused());

        freeForHumans.unpause();
        assertFalse(freeForHumans.paused());
    }

    function test_pause_revertsNonOwner() public {
        vm.prank(nonWhitelisted);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonWhitelisted));
        freeForHumans.pause();
    }

    // ============ View Function Tests ============

    function test_getRemainingBudget() public {
        uint256 campaignId = _createBasicCampaign();

        assertEq(freeForHumans.getRemainingBudget(campaignId), TOTAL_BUDGET);

        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        assertEq(freeForHumans.getRemainingBudget(campaignId), TOTAL_BUDGET - ORB_CLAIM_AMOUNT);
    }

    function test_canClaim_oneTimeCampaign() public {
        uint256 campaignId = _createBasicCampaign();

        (bool eligible, uint256 nextTime) = freeForHumans.canClaim(NULLIFIER_HASH, campaignId, 1);
        assertTrue(eligible);
        assertEq(nextTime, 0);

        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        (eligible, nextTime) = freeForHumans.canClaim(NULLIFIER_HASH, campaignId, 1);
        assertFalse(eligible);
    }

    function test_canClaim_recurringCampaign() public {
        uint256 campaignId = _createRecurringCampaign();

        (bool eligible, uint256 nextTime) = freeForHumans.canClaim(NULLIFIER_HASH, campaignId, 1);
        assertTrue(eligible);
        assertEq(nextTime, 0);

        vm.prank(relayer);
        freeForHumans.claim(campaignId, recipient, ROOT, NULLIFIER_HASH, proof, 1);

        (eligible, nextTime) = freeForHumans.canClaim(NULLIFIER_HASH, campaignId, 1);
        assertFalse(eligible);
        assertEq(nextTime, block.timestamp + ONE_DAY);

        vm.warp(block.timestamp + ONE_DAY);

        (eligible, nextTime) = freeForHumans.canClaim(NULLIFIER_HASH, campaignId, 1);
        assertTrue(eligible);
        assertEq(nextTime, 0);
    }

    function test_canClaim_returnsFalseForInactiveCampaign() public {
        uint256 campaignId = _createBasicCampaign();

        vm.prank(creator);
        freeForHumans.cancelCampaign(campaignId);

        (bool eligible,) = freeForHumans.canClaim(NULLIFIER_HASH, campaignId, 1);
        assertFalse(eligible);
    }

    function test_canClaim_returnsFalseForExpiredCampaign() public {
        uint256 campaignId = _createBasicCampaign();

        vm.warp(block.timestamp + ONE_WEEK + 1);

        (bool eligible,) = freeForHumans.canClaim(NULLIFIER_HASH, campaignId, 1);
        assertFalse(eligible);
    }

    // ============ Helper Functions ============

    function _createBasicCampaign() internal returns (uint256) {
        vm.startPrank(creator);
        token.approve(address(freeForHumans), TOTAL_BUDGET);
        uint256 campaignId = freeForHumans.createCampaign(
            address(token),
            ORB_CLAIM_AMOUNT,
            NFC_CLAIM_AMOUNT,
            TOTAL_BUDGET,
            block.timestamp + ONE_WEEK,
            false,
            0,
            "Test Campaign",
            "A test campaign",
            ""
        );
        vm.stopPrank();
        return campaignId;
    }

    function _createRecurringCampaign() internal returns (uint256) {
        vm.startPrank(creator);
        token.approve(address(freeForHumans), TOTAL_BUDGET);
        uint256 campaignId = freeForHumans.createCampaign(
            address(token),
            ORB_CLAIM_AMOUNT,
            NFC_CLAIM_AMOUNT,
            TOTAL_BUDGET,
            block.timestamp + ONE_WEEK,
            true,
            ONE_DAY,
            "Recurring Campaign",
            "Claims available daily",
            ""
        );
        vm.stopPrank();
        return campaignId;
    }
}
