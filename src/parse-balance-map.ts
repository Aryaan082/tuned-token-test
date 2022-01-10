import { BigNumber, utils } from 'ethers'
import BalanceTree from './balance-tree'

const { isAddress, getAddress } = utils

// This is the blob that gets distributed and pinned to IPFS.
// It is completely sufficient for recreating the entire merkle tree.
// Anyone can verify that all air drops are included in the tree,
// and the tree has no additional distributions.
interface MerkleDistributorInfo {
  merkleRoot: string
  tokenTotal: string
  claims: {
    [account: string]: {
      index: number
      amount: string
      proof: string[]
    }
  }
}

type OldFormat = { [account: string]: number | string }
type NewFormat = { account: string; amount: string }

export function parseBalanceMap(balances: OldFormat | NewFormat[]): MerkleDistributorInfo {
  // if balances are in an old format, process them
  const balancesInNewFormat: NewFormat[] = Array.isArray(balances)
    ? balances
    : Object.keys(balances).map(
        (address): NewFormat => ({
          account: address,
          amount: `0x${balances[address].toString(16)}`,
        })
      )

  const dataByAddress = balancesInNewFormat.reduce<{
    [address: string]: { amount: BigNumber }
  }>((memo, { account: address, amount }) => {
    if (!isAddress(address)) {
      throw new Error(`Found invalid address: ${address}`)
    }
    const parsed = getAddress(address)
    if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`)
    const parsedNum = BigNumber.from(amount)
    if (parsedNum.lte(0)) throw new Error(`Invalid amount for account: ${address}`)
    memo[parsed] = { amount: parsedNum }
    return memo
  }, {})

  const sortedAddresses = Object.keys(dataByAddress).sort()

  const accountToAmountMap = sortedAddresses.map((address) => ({ account: address, amount: dataByAddress[address].amount }))

  // construct a tree
  const tree = new BalanceTree(accountToAmountMap)

  // generate claims
  const claims = sortedAddresses.reduce<{
    [address: string]: { amount: string; index: number; proof: string[] }
  }>((memo, address, index) => {
    const { amount } = dataByAddress[address]
    memo[address] = {
      index,
      amount: amount.toHexString(),
      proof: tree.getProof(index, address, amount)
    }
    return memo
  }, {})

  const tokenTotal: BigNumber = sortedAddresses.reduce<BigNumber>(
    (memo, key) => memo.add(dataByAddress[key].amount),
    BigNumber.from(0)
  )

  return {
    merkleRoot: tree.getHexRoot(),
    tokenTotal: tokenTotal.toHexString(),
    claims,
  }
}
