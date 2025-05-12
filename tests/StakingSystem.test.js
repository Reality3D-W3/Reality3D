const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingSystem", function () {
    let Reality3DToken;
    let StakingSystem;
    let token;
    let stakingSystem;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        Reality3DToken = await ethers.getContractFactory("Reality3DToken");
        token = await Reality3DToken.deploy();
        await token.deployed();

        StakingSystem = await ethers.getContractFactory("StakingSystem");
        stakingSystem = await StakingSystem.deploy(token.address);
        await stakingSystem.deployed();

        // Transfer some tokens to test accounts
        const amount = ethers.utils.parseEther("1000");
        await token.distributeToStakers([addr1.address, addr2.address], [amount, amount]);
        await token.connect(addr1).approve(stakingSystem.address, amount);
        await token.connect(addr2).approve(stakingSystem.address, amount);
    });

    describe("Staking", function () {
        const stakeAmount = ethers.utils.parseEther("100");

        it("Should allow users to stake tokens", async function () {
            await stakingSystem.connect(addr1).stake(stakeAmount);
            const stakeInfo = await stakingSystem.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(stakeAmount);
        });

        it("Should update total staked amount", async function () {
            await stakingSystem.connect(addr1).stake(stakeAmount);
            expect(await stakingSystem.totalStaked()).to.equal(stakeAmount);
        });

        it("Should not allow staking 0 tokens", async function () {
            await expect(
                stakingSystem.connect(addr1).stake(0)
            ).to.be.revertedWith("Cannot stake 0 tokens");
        });
    });

    describe("Unstaking", function () {
        const stakeAmount = ethers.utils.parseEther("100");

        beforeEach(async function () {
            await stakingSystem.connect(addr1).stake(stakeAmount);
        });

        it("Should not allow unstaking before minimum duration", async function () {
            await expect(
                stakingSystem.connect(addr1).unstake(stakeAmount)
            ).to.be.revertedWith("Minimum stake duration not met");
        });

        it("Should allow unstaking after minimum duration", async function () {
            await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            await stakingSystem.connect(addr1).unstake(stakeAmount);
            const stakeInfo = await stakingSystem.getStakeInfo(addr1.address);
            expect(stakeInfo.amount).to.equal(0);
        });
    });

    describe("Rewards", function () {
        const stakeAmount = ethers.utils.parseEther("1000");

        beforeEach(async function () {
            await stakingSystem.connect(addr1).stake(stakeAmount);
        });

        it("Should calculate rewards correctly", async function () {
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            const reward = await stakingSystem.calculateReward(addr1.address);
            expect(reward).to.equal(stakeAmount.mul(15).div(100));
        });

        it("Should allow claiming rewards", async function () {
            await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");

            const initialBalance = await token.balanceOf(addr1.address);
            await stakingSystem.connect(addr1).claimReward();
            const finalBalance = await token.balanceOf(addr1.address);
            expect(finalBalance.sub(initialBalance)).to.be.above(0);
        });
    });

    describe("Emergency withdrawal", function () {
        it("Should allow owner to withdraw tokens", async function () {
            const amount = ethers.utils.parseEther("100");
            await stakingSystem.connect(addr1).stake(amount);

            await stakingSystem.emergencyWithdraw();
            const balance = await token.balanceOf(stakingSystem.address);
            expect(balance).to.equal(0);
        });

        it("Should prevent non-owners from withdrawing", async function () {
            await expect(
                stakingSystem.connect(addr1).emergencyWithdraw()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});