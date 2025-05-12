// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingSystem is ReentrancyGuard, Ownable {
    IERC20 public reality3DToken;

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        uint256 lastRewardClaim;
    }

    mapping(address => Stake) public stakes;
    uint256 public totalStaked;
    uint256 public constant REWARD_RATE = 15; // 15% APY
    uint256 public constant MIN_STAKE_DURATION = 7 days;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address _tokenAddress) {
        reality3DToken = IERC20(_tokenAddress);
    }

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Cannot stake 0 tokens");
        require(reality3DToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        if (stakes[msg.sender].amount > 0) {
            claimReward();
        }

        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].timestamp = block.timestamp;
        stakes[msg.sender].lastRewardClaim = block.timestamp;
        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external nonReentrant {
        Stake storage userStake = stakes[msg.sender];
        require(_amount > 0 && _amount <= userStake.amount, "Invalid amount");
        require(block.timestamp >= userStake.timestamp + MIN_STAKE_DURATION, "Minimum stake duration not met");

        claimReward();

        userStake.amount -= _amount;
        totalStaked -= _amount;

        require(reality3DToken.transfer(msg.sender, _amount), "Transfer failed");

        emit Unstaked(msg.sender, _amount);
    }

    function claimReward() public {
        Stake storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stakes found");

        uint256 reward = calculateReward(msg.sender);
        require(reward > 0, "No rewards to claim");

        userStake.lastRewardClaim = block.timestamp;
        require(reality3DToken.transfer(msg.sender, reward), "Reward transfer failed");

        emit RewardClaimed(msg.sender, reward);
    }

    function calculateReward(address _user) public view returns (uint256) {
        Stake memory userStake = stakes[_user];
        if (userStake.amount == 0) return 0;

        uint256 stakingDuration = block.timestamp - userStake.lastRewardClaim;
        return (userStake.amount * REWARD_RATE * stakingDuration) / (365 days * 100);
    }

    function getStakeInfo(address _user) external view returns (
        uint256 amount,
        uint256 timestamp,
        uint256 lastRewardClaim,
        uint256 pendingRewards
    ) {
        Stake memory userStake = stakes[_user];
        return (
            userStake.amount,
            userStake.timestamp,
            userStake.lastRewardClaim,
            calculateReward(_user)
        );
    }

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = reality3DToken.balanceOf(address(this));
        require(reality3DToken.transfer(owner(), balance), "Transfer failed");
    }
}