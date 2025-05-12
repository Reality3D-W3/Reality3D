const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reality3DToken", function () {
    let Reality3DToken;
    let token;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        Reality3DToken = await ethers.getContractFactory("Reality3DToken");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        token = await Reality3DToken.deploy();
        await token.deployed();
    });

    describe("Deployment", function () {
        it("Should assign the total supply of tokens to the contract", async function () {
            const totalSupply = await token.totalSupply();
            const contractBalance = await token.balanceOf(token.address);
            expect(contractBalance).to.equal(totalSupply);
        });

        it("Should allocate ecosystem tokens to owner", async function () {
            const ecosystemAllocation = await token.ECOSYSTEM_ALLOCATION();
            const ownerBalance = await token.balanceOf(owner.address);
            expect(ownerBalance).to.equal(ecosystemAllocation);
        });
    });

    describe("Team token vesting", function () {
        it("Should not release tokens before vesting starts", async function () {
            await expect(token.releaseTeamTokens()).to.be.revertedWith("No tokens to release");
        });

        it("Should release tokens according to vesting schedule", async function () {
            const oneYear = 365 * 24 * 60 * 60;
            await ethers.provider.send("evm_increaseTime", [oneYear]);
            await ethers.provider.send("evm_mine");

            await token.releaseTeamTokens();
            const teamAllocation = await token.TEAM_ALLOCATION();
            const ownerBalance = await token.balanceOf(owner.address);
            expect(ownerBalance).to.be.closeTo(
                teamAllocation.div(2).add(await token.ECOSYSTEM_ALLOCATION()),
                ethers.utils.parseEther("1")
            );
        });
    });

    describe("Community distribution", function () {
        it("Should allow owner to distribute tokens to stakers", async function () {
            const stakers = [addr1.address, addr2.address];
            const amounts = [
                ethers.utils.parseEther("1000"),
                ethers.utils.parseEther("2000")
            ];

            await token.distributeToStakers(stakers, amounts);

            expect(await token.balanceOf(addr1.address)).to.equal(amounts[0]);
            expect(await token.balanceOf(addr2.address)).to.equal(amounts[1]);
        });

        it("Should prevent distribution exceeding community allocation", async function () {
            const stakers = [addr1.address];
            const amounts = [await token.COMMUNITY_ALLOCATION().add(1)];

            await expect(
                token.distributeToStakers(stakers, amounts)
            ).to.be.revertedWith("Exceeds community allocation");
        });
    });

    describe("Token burning", function () {
        it("Should allow users to burn their tokens", async function () {
            const burnAmount = ethers.utils.parseEther("1000");
            await token.distributeToStakers([addr1.address], [burnAmount]);
            await token.connect(addr1).burn(burnAmount);

            expect(await token.balanceOf(addr1.address)).to.equal(0);
        });
    });
});