# Merkle Distributor Instructions

1. Create a csv file with airdrop allocation organized as columns (wallet,tokens).

2. Place that file in the scripts directory and run `python csv_to_json.py ... ...`. Parameter 1 is the csv file name and parameter 2 is the new json file name.
    - Ex. `python csv-to-json.py claim-dataset.csv allocation_output`

*Compile all the Uniswap merkle-distributor `/src` files as js files by running `npx tsc` to get the rest of the files in the published `/scripts` directory.*

3. Run the command `node generate-merkle-root.js -i allocation_output.json >> allocation_merkle_output.json` to create a new json file with the merkle root, token total, and claim data. Merkle root and token total are needed to run the `MerkleDistributor.sol` contract and the claim data is needed for users to extract data to properly claim their tokens.

4. Run the command `node verify-merkle-root.js -i allocation_merkle_output.json` to verify the proofs of the merkle root for good measure.

You can now deploy the `MerkleDistributor.sol` contract with the **token address** and **merkle root** given by the above process. You must also transfer the `MerkleDistributor.sol` contract address the **token total** also found in your final `allocation_merkle_output.json` file. For users to be able to effectively claim from your distributor contract, publish the final `allocation_merkle_output.json` file so that users can properly look up relevant information such as their index, their claim, and their proof to claim from `MerkleDistributor.sol`.

Uniswap published their `allocation_merkle_output` here: [https://mrkl.uniswap.org/](https://mrkl.uniswap.org/)

All the packages and procedures are refined from Uniswap and Audius Project. Thanks!
