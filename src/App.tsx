
import { useMemo } from "react";
import {Route, Routes, BrowserRouter as Router} from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, } from '@solana/wallet-adapter-react-ui';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter, SolflareWalletAdapter, TorusWalletAdapter } from '@solana/wallet-adapter-wallets';
import '@solana/wallet-adapter-react-ui/styles.css'

import { ProgramProvider } from './utils/ProgramProvider';
import NftStake from "./pages/stake";
import AdminPage from "./pages/admin";
import { clusterApiUrl } from "@solana/web3.js";

import './bootstrap.min.css';
import 'antd/dist/reset.css';
import './assets/style.scss'

function App() {
  const network = WalletAdapterNetwork.Devnet
  const endpoint = clusterApiUrl('devnet')
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter({ network }),
    new TorusWalletAdapter()
  ], [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ProgramProvider>
            <Router>
              <Routes>
                <Route path="/" element={<NftStake/>}/>
                <Route path="/admin" element={<AdminPage/>}/>
              </Routes>
            </Router>
          </ProgramProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;