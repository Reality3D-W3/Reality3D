// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Reality3DToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant ECOSYSTEM_ALLOCATION = 300000000 * 10**18; // 30% for ecosystem
    uint256 public constant TEAM_ALLOCATION = 200000000 * 10**18; // 20% for team
    uint256 public constant COMMUNITY_ALLOCATION = 500000000 * 10**18; // 50% for community

    // Vesting periods
    uint256 public constant TEAM_VESTING_DURATION = 730 days; // 2 years
    uint256 public teamVestingStart;
    uint256 public teamTokensReleased;

    constructor() ERC20("Reality3D Token", "R3D") {
        teamVestingStart = block.timestamp;
        _mint(address(this), INITIAL_SUPPLY);

        // Allocate ecosystem tokens
        _transfer(address(this), owner(), ECOSYSTEM_ALLOCATION);
    }

    function releaseTeamTokens() external {
        require(block.timestamp >= teamVestingStart, "Vesting not started");
        uint256 elapsedTime = block.timestamp - teamVestingStart;
        require(elapsedTime <= TEAM_VESTING_DURATION, "Vesting completed");

        uint256 totalVestedAmount = (TEAM_ALLOCATION * elapsedTime) / TEAM_VESTING_DURATION;
        uint256 releasableAmount = totalVestedAmount - teamTokensReleased;
        require(releasableAmount > 0, "No tokens to release");

        teamTokensReleased += releasableAmount;
        _transfer(address(this), owner(), releasableAmount);
    }

    function distributeToStakers(address[] calldata stakers, uint256[] calldata amounts) external onlyOwner {
        require(stakers.length == amounts.length, "Arrays length mismatch");
        uint256 totalAmount = 0;
        
        for(uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(totalAmount <= COMMUNITY_ALLOCATION, "Exceeds community allocation");
        
        for(uint256 i = 0; i < stakers.length; i++) {
            _transfer(address(this), stakers[i], amounts[i]);
        }
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}