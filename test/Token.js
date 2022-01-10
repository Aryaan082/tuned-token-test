const fs = require("fs");
const { expect } = require("chai");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe("Token contract", function () {
  let Token;
  let tunedToken;
  let deployer;
  let owner;
  let minter;
  let addr1;
  let addr2;
  let addrs;
  let blockNumber;
  let deployerNumVotes;

  describe("Deployment", function () {
    before(async function () {
      // Get the ContractFactory and Signers here.
      Token = await ethers.getContractFactory("Tuned");
      [deployer, owner, minter, addr1, addr2, ...addrs] = await ethers.getSigners();
  
      // To deploy our contract, we just have to call Token.deploy() and await
      // for it to be deployed(), which happens once its transaction has been
      // mined.
      tunedToken = await Token.deploy(owner.address, minter.address, Math.floor(Date.now() / 1000) + 100);
    });

    it("Check if minter was assigned correctly", async function () {
      // Expects minter to be our Signer's minter
      expect(await tunedToken.minter()).to.equal(minter.address);
    });

    it("Check if owner is assigned total supply of tokens", async function () {
      // Expects owner to recieve all tokens on deployment
      expect(await tunedToken.balanceOf(owner.address)).to.equal(await tunedToken.totalSupply());
    });
  });

  describe("Minting", function () {
    before(async function () {
      // Get the ContractFactory and Signers here.
      Token = await ethers.getContractFactory("Tuned");
      [deployer, owner, minter, addr1, addr2, ...addrs] = await ethers.getSigners();
  
      // To deploy our contract, we just have to call Token.deploy() and await
      // for it to be deployed(), which happens once its transaction has been
      // mined.
      tunedToken = await Token.deploy(owner.address, minter.address, Math.floor(Date.now() / 1000) + 3);
    });

    it("Check minter reassignment", async function () {
      // Current minter sets owner to new minter
      await tunedToken.connect(minter).setMinter(owner.address);

      // Expects owner to be minter
      expect(await tunedToken.minter()).to.equal(owner.address);
    });

    it("Check supply increase and owner balance increase on mint", async function () {
      // Get initial owner balance, inital total supply and limit of raw mint amount
      const initialOwnerBalance = await tunedToken.balanceOf(owner.address);
      const initialTotalSupply = await tunedToken.totalSupply();
      const mintCap = ethers.BigNumber.from(await tunedToken.mintCap());
      const rawMintAmount = mintCap.mul(initialTotalSupply).div(100);

      // Mint tokens
      await sleep(4000);
      await tunedToken.connect(owner).mint(owner.address, rawMintAmount);
      
      // Get final owner balance and final total supply
      const finalOwnerBalance = await tunedToken.balanceOf(owner.address);
      const finalTotalSupply = await tunedToken.totalSupply();

      // Expects inital total supply plus raw mint amount to equal final total supply
      expect(initialOwnerBalance.add(rawMintAmount)).to.equal(finalOwnerBalance);
      expect(initialTotalSupply.add(rawMintAmount)).to.equal(finalTotalSupply);
    });
  });

  describe("Transactions", function () {
    before(async function () {
      // Get the ContractFactory and Signers here.
      Token = await ethers.getContractFactory("Tuned");
      [deployer, owner, minter, addr1, addr2, ...addrs] = await ethers.getSigners();
  
      // To deploy our contract, we just have to call Token.deploy() and await
      // for it to be deployed(), which happens once its transaction has been
      // mined.
      tunedToken = await Token.deploy(owner.address, minter.address, Math.floor(Date.now() / 1000) + 100);
    });

    it("Check transfer between accounts", async function () {
      // Transfer 50 tokens from owner to addr1
      await tunedToken.connect(owner).transfer(addr1.address, 50);
      const addr1Balance = await tunedToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await tunedToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await tunedToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Check fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await tunedToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (100000000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(
        tunedToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("Tnd::_transferTokens: transfer amount exceeds balance");

      // Owner balance shouldn't have changed.
      expect(await tunedToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });

    it("Check update balances after transfers", async function () {
      const initialOwnerBalance = await tunedToken.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1.
      await tunedToken.connect(owner).transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2.
      await tunedToken.connect(owner).transfer(addr2.address, 50);

      // Check balances.
      const finalOwnerBalance = await tunedToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

      const addr1Balance = await tunedToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(100);

      const addr2Balance = await tunedToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(100);
    });
  });

  describe("Allowances", function () {
    before(async function () {
      // Get the ContractFactory and Signers here.
      Token = await ethers.getContractFactory("Tuned");
      [deployer, owner, minter, addr1, addr2, ...addrs] = await ethers.getSigners();
  
      // To deploy our contract, we just have to call Token.deploy() and await
      // for it to be deployed(), which happens once its transaction has been
      // mined.
      tunedToken = await Token.deploy(owner.address, minter.address, Math.floor(Date.now() / 1000) + 100);

      // Add 100 tuned token to addr1 and addr2
      await tunedToken.connect(owner).transfer(addr1.address, 100);
      await tunedToken.connect(owner).transfer(addr2.address, 100);
    });

    it("Check allowance after approve", async function () {
      // Approve the deployer to transfer up to 50 tokens from addr1
      await tunedToken.connect(addr1).approve(deployer.address, 50);

      // Check number of tokens deployer is approved to spend on behalf of addr1
      const allowanceAmount1 = await tunedToken.allowance(addr1.address, deployer.address);

      // Expects allowance to equal 50
      expect(allowanceAmount1).to.equal(50);

      // Approve the deployer to transfer unlimited tokens from addr2
      const unlimited = ethers.BigNumber.from(2).pow(256).sub(1);
      await tunedToken.connect(addr2).approve(deployer.address, unlimited);

      // Check number of tokens addr2 is approved to spend on behalf of deployer
      const allowanceAmount2 = await tunedToken.allowance(addr2.address, deployer.address);

      // Expects allowance to equal 2**96-1
      expect(allowanceAmount2).to.equal(ethers.BigNumber.from(2).pow(96).sub(1));
    });

    it("Check transfer from function", async function () {
      // Get initial balance of deployer, allowance of addr1 for deployer and transfer amount
      // from addr1 to deployer
      const initialBalance = await tunedToken.balanceOf(deployer.address);
      const allowanceAmount1 = await tunedToken.allowance(addr1.address, deployer.address);
      const transferAmount = 50;

      // Transfer transferAmount of tokens from addr1 to deployer
      await tunedToken.transferFrom(addr1.address, deployer.address, transferAmount);

      // Expect allowance amount to go down by transferAmount and deployer balance to go up by
      // transferAmount
      expect(allowanceAmount1.sub(transferAmount)).to.equal(await tunedToken.allowance(addr1.address, deployer.address));
      expect(initialBalance.add(transferAmount)).to.equal(await tunedToken.balanceOf(deployer.address));
    });
  });

  describe("Governance", function () {
    before(async function () {
      // Get the ContractFactory and Signers here.
      Token = await ethers.getContractFactory("Tuned");
      [deployer, owner, minter, addr1, addr2, ...addrs] = await ethers.getSigners();
  
      // To deploy our contract, we just have to call Token.deploy() and await
      // for it to be deployed(), which happens once its transaction has been
      // mined.
      tunedToken = await Token.deploy(owner.address, minter.address, Math.floor(Date.now() / 1000) + 100);

      // Add 100 tuned token to addr1 and addr2
      await tunedToken.connect(owner).transfer(addr1.address, 100);
      await tunedToken.connect(owner).transfer(addr2.address, 100);
    });

    it("Check vote delegation", async function () {
      // Number of tokens held by owner
      const ownerBalance = await tunedToken.balanceOf(owner.address);

      // Owner delegates votes to deployer
      await tunedToken.connect(owner).delegate(deployer.address);

      // Block number when deployer was delegated all of owner's votes
      blockNumber = await ethers.provider.getBlockNumber();
      deployerNumVotes = await tunedToken.getCurrentVotes(deployer.address);

      // Expects final number of votes controlled by deployer to be equal to the delegated votes from
      // owner. Then expects votes in control by addr1 to equal 0 since it has not been delegated any votes.
      expect(ownerBalance).to.equal(await tunedToken.getCurrentVotes(deployer.address));
      expect(0).to.equal(await tunedToken.getCurrentVotes(addr1.address));
    });

    it("Check self vote delegation", async function () {
      // Number of tokens held by owner and addr1
      const ownerBalance = await tunedToken.balanceOf(owner.address);
      const addr1Balance = await tunedToken.balanceOf(addr1.address);

      // Owner delegates its votes to addr1 and addr1 delegates its votes to itself
      await tunedToken.connect(owner).delegate(addr1.address);
      await tunedToken.connect(addr1).delegate(addr1.address);

      // Expects final number of votes controlled by addr1 to be equal to the delegated votes from
      // owner and itself (addr1). Then expects votes controlled by deployer to be 0 since owner
      // redelegated their votes.
      expect(ownerBalance.add(addr1Balance)).to.equal(await tunedToken.getCurrentVotes(addr1.address));
      expect(0).to.equal(await tunedToken.getCurrentVotes(deployer.address));
    });  

    it("Check prior votes", async function () {
      // Get the number of votes in control by deployer at block (blockNumber)
      const deployerHistoricVotes = await tunedToken.getPriorVotes(deployer.address, blockNumber);

      // Expect the number of votes at the specified block number to equal the
      // the amount of votes at the given block number
      expect(deployerHistoricVotes).to.equal(deployerNumVotes);
    });  
  });
});

describe("Airdrop contract", function () {
  const rawdata = fs.readFileSync("allocation_merkle_output.json");
  const merkleTree = JSON.parse(rawdata);
  const merkleRoot = merkleTree.merkleRoot;
  let addr1MerkleTree;
  let addr2MerkleTree;
  let airdrop;

  before(async function () {
    // Get the ContractFactory and Signers here.
    Token = await ethers.getContractFactory("Tuned");
    MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
    [deployer, owner, minter, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contracts, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    tunedToken = await Token.deploy(owner.address, minter.address, Math.floor(Date.now() / 1000) + 100);
    airdrop = await MerkleDistributor.deploy(tunedToken.address, merkleRoot);

    // Access the addr1 and addr2 key of the allocation map
    addr1MerkleTree = merkleTree.claims[addr1.address];
    addr2MerkleTree = merkleTree.claims[addr2.address];

    // Transfer tokens to token contract for users to claim
    await tunedToken.connect(owner).transfer(airdrop.address, merkleTree.tokenTotal);
  });

  it("Check airdrop claims", async function () {
    // Get initial balance of addr1 and initial balance of the airdrop contract
    const initialAddr1Balance = await tunedToken.balanceOf(addr1.address);
    const initalAirdropContractBalance = await tunedToken.balanceOf(airdrop.address);

    // Addr1 claim airdrop
    await airdrop.claim(addr1MerkleTree.index, addr1.address, addr1MerkleTree.amount, addr1MerkleTree.proof);

    // Expect initial addr1 balance + amount allocated to addr1 to be final addr1 balance
    expect(initialAddr1Balance.add(addr1MerkleTree.amount)).to.equal(await tunedToken.balanceOf(addr1.address));
    expect(initalAirdropContractBalance.sub(addr1MerkleTree.amount)).to.equal(await tunedToken.balanceOf(airdrop.address));
  });

  it("Check airdrop claim reverts", async function () {
    // Expect the a second try claim for addr1 to revert and wrong proof for addr2 claim to revert
    await expect(airdrop.claim(addr1MerkleTree.index, addr1.address, addr1MerkleTree.amount, addr1MerkleTree.proof)).to.be.revertedWith('MerkleDistributor: Drop already claimed.');
    await expect(airdrop.claim(addr2MerkleTree.index, addr2.address, addr2MerkleTree.amount, addr1MerkleTree.proof)).to.be.revertedWith('MerkleDistributor: Invalid proof.');
  });

  it("Check status of claims", async function () {
    // Expect the status of airdrop claim for addr1 to be true and addr2 to be false
    expect(await airdrop.isClaimed(addr1MerkleTree.index)).to.equal(true);
    expect(await airdrop.isClaimed(addr2MerkleTree.index)).to.equal(false);
  });
});