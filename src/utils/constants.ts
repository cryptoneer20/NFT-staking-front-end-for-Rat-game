import { ConfirmOptions, PublicKey } from '@solana/web3.js'
import {notification} from 'antd'

export const InfoStaking = {
    pool: new PublicKey("GMYrybRe5gHPd1zWb9RKHCHnN77kynth52zzdjcVPjW4"),
    programId: new PublicKey("C6wGW14B9SUBsG1xVENNvtCeyBgBzbfzbaVaLTtCEuwc"),
    idl: require('./staking.json'),
    rewardToken: new PublicKey("DjQLmpLp6PiPv9RqHXtqia4itdWCrBcdSSj4wSwLHZzD"),
    rewardPeriod: 30,
    decimals: 9,
    reward: [
        {badge: "Bronze", collection: new PublicKey("EUanG7nVAXnH43mQFTgfyxMYeEdTjNiZFtFswBJmXzki"), amount: 100},
        {badge: "Silver", collection: new PublicKey("8CtXuE1GaJKtGBiSHqzdU1XrUGcaDNc2sjoLVFi7hMxJ"), amount: 1000},
        {badge: "Gold", collection: new PublicKey("8VG4sGuEeWK9bxKUDdfSFRCCggc339mWgcR1hpJ24ASs"), amount: 10000},
        {badge: "Platinum", collection: new PublicKey("A1SsJVezX7214m26m8stU8KS2goEUhRFheiLQu7VCrdu"), amount: 100000},
        {badge: "Diamond", collection: new PublicKey("4sFheFkruEk6XN8cEnkfmj2jZbY7wB57PB5TeFwWy9k6"), amount: 1000000}, 
    ],
}

export const confirmOptions: ConfirmOptions = {commitment : 'finalized',preflightCommitment : 'finalized',skipPreflight : false}

export const openNotification = (type : 'success' | 'error' | 'info' | 'warning', title : string, description? : string) => {
    notification[type]({
        message : title, description : description, placement : 'topLeft'
    })
}