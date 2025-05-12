const hre = require("hardhat");

async function main() {
    // Deploy Reality3D Token
    const Reality3DToken = await hre.ethers.getContractFactory("Reality3DToken");
    const token = await Reality3DToken.deploy();
    await token.deployed();
    console.log("Reality3D Token deployed to:", token.address);

    // Deploy NFT Marketplace
    const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
    const marketplace = await NFTMarketplace.deploy();
    await marketplace.deployed();
    console.log("NFT Marketplace deployed to:", marketplace.address);

    // Deploy Staking System
    const StakingSystem = await hre.ethers.getContractFactory("StakingSystem");
    const stakingSystem = await StakingSystem.deploy(token.address);
    await stakingSystem.deployed();
    console.log("Staking System deployed to:", stakingSystem.address);

    // Verify contracts on Etherscan
    if (hre.network.name !== "hardhat") {
        console.log("Waiting for block confirmations...");
        await token.deployTransaction.wait(6);
        await marketplace.deployTransaction.wait(6);
        await stakingSystem.deployTransaction.wait(6);

        await hre.run("verify:verify", {
            address: token.address,
            constructorArguments: [],
        });

        await hre.run("verify:verify", {
            address: marketplace.address,
            constructorArguments: [],
        });

        await hre.run("verify:verify", {
            address: stakingSystem.address,
            constructorArguments: [token.address],
        });
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });