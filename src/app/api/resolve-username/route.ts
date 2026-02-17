import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { normalize } from 'viem/ens';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';

interface ResolveRequest {
  username: string;
}

interface ResolveResponse {
  success: boolean;
  address?: string;
  error?: string;
}

// ENS client for resolving World ID usernames
const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export async function POST(request: NextRequest): Promise<NextResponse<ResolveResponse>> {
  try {
    const body: ResolveRequest = await request.json();

    if (!body.username) {
      return NextResponse.json(
        { success: false, error: 'Missing username' },
        { status: 400 }
      );
    }

    const { username } = body;

    // If it's already a valid address, return it
    if (isAddress(username)) {
      return NextResponse.json({
        success: true,
        address: username,
      });
    }

    // Handle @username format
    let ensName = username;
    if (username.startsWith('@')) {
      ensName = username.slice(1);
    }

    // Append .world.id if not already an ENS name
    if (!ensName.includes('.')) {
      ensName = `${ensName}.world.id`;
    }

    // Normalize and resolve
    try {
      const normalized = normalize(ensName);
      const address = await ensClient.getEnsAddress({ name: normalized });

      if (!address) {
        return NextResponse.json(
          { success: false, error: `Could not resolve username: ${username}` },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        address,
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to resolve username: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error resolving username:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resolve username' },
      { status: 500 }
    );
  }
}
