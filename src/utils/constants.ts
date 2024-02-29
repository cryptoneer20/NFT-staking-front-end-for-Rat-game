import { ConfirmOptions, PublicKey } from '@solana/web3.js'
import {notification} from 'antd'

export const InfoStaking = {
    pool: new PublicKey("5LqZxJ9EEY5GAFyquXvzWh6Y7TJmySnddwQyiWRfyPcy"),
    programId: new PublicKey("ratnSpwdsporDA6rBDCnZzi5BvuoGhQy6hqzeHc66QE"),
    idl: require('./staking.json'),
    rewardToken: new PublicKey("6YTEx36MonaAwcaMciu7KAzx1zdUkQBmHrxLTkKMq98C"),
    rewardDecimals: 9,
    collection: new PublicKey('drq1T2iYdF37KS8Qgj8xFzULrjMAC6EsFS8sJM9mPGj')
}

export const confirmOptions: ConfirmOptions = {commitment : 'finalized',preflightCommitment : 'finalized',skipPreflight : false}

export const openNotification = (type : 'success' | 'error' | 'info' | 'warning', title : string, description? : string) => {
    notification[type]({
        message : title, description : description, placement : 'topLeft'
    })
}