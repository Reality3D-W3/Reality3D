const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
    let NFTMarketplace;
    let nftMarketplace;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        nftMarketplace = await NFTMarketplace.deploy();
        await nftMarketplace.deployed();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await nftMarketplace.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol", async function () {
            expect(await nftMarketplace.name()).to.equal("Reality3D NFTs");
            expect(await nftMarketplace.symbol()).to.equal("R3D");
        });
    });

    describe("Market operations", function () {
        const tokenURI = "https://test-token-uri.com";
        const price = ethers.utils.parseUnits("1", "ether");
        const listingPrice = ethers.utils.parseUnits("0.025", "ether");

        it("Should create and execute market sales", async function () {
            await nftMarketplace.createToken(tokenURI, price, { value: listingPrice });
            const items = await nftMarketplace.fetchMarketItems();
            expect(items.length).to.equal(1);

            await nftMarketplace.connect(addr1).createMarketSale(1, { value: price });
            const newItems = await nftMarketplace.fetchMarketItems();
            expect(newItems.length).to.equal(0);
        });

        it("Should allow reselling of tokens", async function () {
            await nftMarketplace.createToken(tokenURI, price, { value: listingPrice });
            await nftMarketplace.connect(addr1).createMarketSale(1, { value: price });

            await nftMarketplace.connect(addr1).resellToken(1, price, { value: listingPrice });
            const items = await nftMarketplace.fetchMarketItems();
            expect(items.length).to.equal(1);
        });
    });

    describe("Listing price", function () {
        it("Should allow owner to update listing price", async function () {
            const newListingPrice = ethers.utils.parseUnits("0.05", "ether");
            await nftMarketplace.updateListingPrice(newListingPrice);
            expect(await nftMarketplace.getListingPrice()).to.equal(newListingPrice);
        });

        it("Should prevent non-owners from updating listing price", async function () {
            const newListingPrice = ethers.utils.parseUnits("0.05", "ether");
            await expect(
                nftMarketplace.connect(addr1).updateListingPrice(newListingPrice)
            ).to.be.revertedWith("Only marketplace owner can update listing price.");
        });
    });
});