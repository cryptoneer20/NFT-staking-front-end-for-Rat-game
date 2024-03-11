import { ConfirmOptions, PublicKey } from '@solana/web3.js'
import {notification} from 'antd'

export const InfoStaking = {
    pool: new PublicKey("2sAedgPupYBMcLkSzqxftdaZvNJVvLZFKebzCboUBfQ7"),
    programId: new PublicKey("ratnSpwdsporDA6rBDCnZzi5BvuoGhQy6hqzeHc66QE"),
    idl: require('./staking.json'),
    rewardToken: new PublicKey("AzTQkc4V666vfD8k8tqbjdKMJwBzNTeMeZRNfct8CKnQ"),
    rewardDecimals: 5,
    collection: new PublicKey('2jG4XWCTC5GXfigeoqJYVKVxL4pxUWRUBdsGKSQHt1Np'),
    totalSupply: 1999,
}

export const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

export const confirmOptions: ConfirmOptions = {commitment : 'finalized',preflightCommitment : 'finalized',skipPreflight : false}

export const openNotification = (type : 'success' | 'error' | 'info' | 'warning', title : string, description? : string) => {
    notification[type]({
        message : title, description : description, placement : 'topLeft'
    })
}