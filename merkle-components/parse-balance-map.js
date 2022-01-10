"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBalanceMap = void 0;
const ethers_1 = require("ethers");
const balance_tree_1 = __importDefault(require("./balance-tree"));
const { isAddress, getAddress } = ethers_1.utils;
function parseBalanceMap(balances) {
    // if balances are in an old format, process them
    const balancesInNewFormat = Array.isArray(balances)
        ? balances
        : Object.keys(balances).map((address) => ({
            account: address,
            amount: `0x${balances[address].toString(16)}`,
        }));
    const dataByAddress = balancesInNewFormat.reduce((memo, { account: address, amount }) => {
        if (!isAddress(address)) {
            throw new Error(`Found invalid address: ${address}`);
        }
        const parsed = getAddress(address);
        if (memo[parsed])
            throw new Error(`Duplicate address: ${parsed}`);
        const parsedNum = ethers_1.BigNumber.from(amount);
        if (parsedNum.lte(0))
            throw new Error(`Invalid amount for account: ${address}`);
        memo[parsed] = { amount: parsedNum };
        return memo;
    }, {});
    const sortedAddresses = Object.keys(dataByAddress).sort();
    const accountToAmountMap = sortedAddresses.map((address) => ({ account: address, amount: dataByAddress[address].amount }));
    // construct a tree
    const tree = new balance_tree_1.default(accountToAmountMap);
    // generate claims
    const claims = sortedAddresses.reduce((memo, address, index) => {
        const { amount } = dataByAddress[address];
        memo[address] = {
            index,
            amount: amount.toHexString(),
            proof: tree.getProof(index, address, amount)
        };
        return memo;
    }, {});
    const tokenTotal = sortedAddresses.reduce((memo, key) => memo.add(dataByAddress[key].amount), ethers_1.BigNumber.from(0));
    return {
        merkleRoot: tree.getHexRoot(),
        tokenTotal: tokenTotal.toHexString(),
        claims,
    };
}
exports.parseBalanceMap = parseBalanceMap;
