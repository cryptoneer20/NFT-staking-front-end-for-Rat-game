import axios from 'axios'
import { useEffect, useState } from 'react'

export default function NftCard(props : any){
    const [nftDetailInfo, setNftDetailInfo] = useState<any>(null)

    useEffect(()=>{
        getNftDetailInfo()
    }, [])

    const getNftDetailInfo = async() => {
        console.log(props)
        try{
            let data = (await axios.get(props.data.metadata.uri)).data
            setNftDetailInfo(data)
        }catch(err){
            setNftDetailInfo(props.data.metadata)
        }
    }

    return <div className='nft' onClick={()=>{props.callbackFunc(props.data.mint)}}>
        {
            nftDetailInfo!=null &&
            <>
                <img className={props.data.selected ? "red-border" : "normal-border"} src={nftDetailInfo.image} alt="Penguin"/>
                <p style={{color : "#e9ffc5"}}>{nftDetailInfo.name}</p>
            </>
        }
    </div>
}