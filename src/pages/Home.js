import React, { useEffect, useState, useRef } from "react";
import { BigNumber, ethers } from "ethers";
import abi from "../utils/payment.json";
import Web3Modal from "web3modal";
import { providers } from "ethers";
import WalletConnectProvider from "@walletconnect/web3-provider";

export default function Home() {
  const contractAddress = "0x62e2c7165Df60B3D079cAADfA11B769ea9CcB28E";
  //const contractAddress = "0xc56bf3625ad76283f42c4df67cfd10f670a2528c";
  //const contractAddress = "0xC56Bf3625aD76283f42c4DF67CFd10f670a2528C";

  const contractABI = abi.abi;
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState();

  const [loading1, setLoading1] = useState(false);
  const [error1, setError1] = useState("");
  const [message1, setMessage1] = useState("");

  const etherRef = useRef();
  const etherAmountRef = useRef();
  const walletRef = useRef();

  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: "c42bd204d32641289769eb8a9a4c1607", // required
      },
    },
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const { ethereum } = window;

    if (!ethereum) {
      alert("Get MetaMask!");
      return;
    }

    web3Modal = new Web3Modal({
      network: "rinkeby", // optional
      cacheProvider: true, // optional
      providerOptions, // required
    });

    provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const accounts = await ethereum.request({ method: "eth_accounts" });
    setAddress(accounts[0]);

    // If user is not connected to the Mainnet network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    // rinkbey - 4
    // bsc - 97
    // polygon - 80001
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const sendEthToAnotherAddr = async () => {
    setError("");
    setMessage("");
    const { ethereum } = window;
    if (!ethereum) {
      return alert("Get MetaMask!");
    }

    if (walletRef.current.value === "") {
      return setError("Please enter your wallet address");
    }
    if (walletRef.current.value.length !== 42) {
      return setError("Please enter a valid wallet address");
    }

    if (ethers.utils.isAddress(walletRef.current.value) === false) {
      return setError("Please enter a valid wallet address");
    }

    if (etherRef.current.value === "") {
      return setError("Please enter ether amount");
    }

    if (etherRef.current.value <= 0) {
      return setError("You cant send zero or less than zero ethers");
    }

    if (ethereum) {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      const paymentContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      const address = walletRef.current.value;
      const ethAmount = etherRef.current.value;

      try {
        const Txn = await paymentContract.sendPayment(address, {
          gasLimit: 300000,
          value: ethers.utils.parseEther(ethAmount),
        });

        await Txn.wait();

        setLoading(false);
        setMessage("Payment was successful");
        walletRef.current.value = "";
        etherRef.current.value = "";
      } catch (error) {
        if (error.code) {
          console.log(error.toString);
          setError(error.message);
        } else {
          setError(error.toString());
          console.log(error.toString());
        }

        setLoading(false);

        walletRef.current.value = "";
        etherRef.current.value = "";
      }
    } else {
      setLoading(false);
      window.alert("Please connect to metamask");
      console.log("Ethereum object doesn't exist!");
    }
  };

  const sendEthToContract = async () => {
    setError1("");
    setMessage1("");
    const { ethereum } = window;
    if (!ethereum) {
      return alert("Get MetaMask!");
    }

    if (etherAmountRef.current.value === "") {
      return setError1("Please enter ether amount");
    }

    if (etherAmountRef.current.value <= 0) {
      return setError1("You cant send zero or less than zero ethers");
    }

    if (ethereum) {
      setLoading1(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      const paymentContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      const ethAmount = etherAmountRef.current.value;

      try {
        const Txn = await paymentContract.sendToContract({
          gasLimit: 300000,
          value: ethers.utils.parseEther(ethAmount),
        });

        await Txn.wait();

        setLoading1(false);
        setMessage1("Payment was successful");
        walletRef.current.value = "";
        etherRef.current.value = "";
      } catch (error) {
        if (error.code) {
          console.log(error.toString);
          setError1(error.message);
        } else {
          setError1(error.toString());
          console.log(error.toString());
        }

        setLoading1(false);

        walletRef.current.value = "";
        etherRef.current.value = "";
      }
    } else {
      setLoading1(false);
      window.alert("Please connect to metamask");
      console.log("Ethereum object doesn't exist!");
    }
  };

  const web3ModalRef = useRef();
  let provider;
  let web3Modal;

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        // Get the provider from web3Modal, which in our case is MetaMask
        // When used for the first time, it prompts the user to connect their wallet
        await getProviderOrSigner();
        const accounts = await ethereum.request({ method: "eth_accounts" });
        setAddress(accounts[0]);
        const provider2 = await getProviderOrSigner();
        const bal = await provider2.getBalance(accounts[0]);

        setBalance(Number(BigNumber.from(bal)) / 10 ** 18);

        localStorage.setItem("wall", "true");

        // Subscribe to accounts change
        provider.on("accountsChanged", async (accounts) => {
          const provider = await getProviderOrSigner();
          const bal = await provider.getBalance(accounts[0]);
          setBalance(Number(BigNumber.from(bal)) / 10 ** 18);
        });

        // Subscribe to chainId change
        provider.on("chainChanged", async (chainId) => {
          console.log("chain", chainId);
          await getProviderOrSigner();
        });

        // Subscribe to provider connection
        provider.on("connect", async (info) => {
          console.log("inf", info);
        });

        // Subscribe to provider disconnection
        provider.on("disconnect", (error) => {
          console.log("dis", error);
          setAddress("");
        });
      } else {
        alert("Please install Metamask");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const disconnectWallet = async () => {
    setAddress("");
    localStorage.removeItem("wall");
    web3Modal = new Web3Modal({
      network: "rinkeby", // optional
      cacheProvider: true, // optional
      providerOptions, // required
    });
    await web3Modal.clearCachedProvider();
  };

  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      if (localStorage.getItem("wall")) {
        // Assign the Web3Modal class to the reference object by setting it's `current` value
        // The `current` value is persisted throughout as long as this page is open
        web3ModalRef.current = new Web3Modal({
          network: "rinkeby",
          providerOptions: {},
          disableInjectedProvider: false,
        });

        connectWallet();
      }
    }
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
  }, [address]);

  return (
    <div>
      <div
        style={{
          marginTop: "100px",
          width: "200px",
          marginLeft: "auto",
          marginRight: "auto",
          textAlign: "center",
        }}
      >
        {address.length > 0 ? (
          <div>
            <button className="button" onClick={disconnectWallet}>
              {address.slice(0, 5) + "....." + address.slice(-5)}
            </button>
            <div>Balance {balance}</div>
          </div>
        ) : (
          <button className="button" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>

      <div className="box">
        <div className="inner__box">
          <div className="text">Send Ether to Another Wallet Address</div>
          <div>
            <input
              className="input"
              ref={etherRef}
              placeholder="Enter amount in ether"
            />
          </div>
          <div>
            <input
              className="input"
              ref={walletRef}
              placeholder="Enter wallet address"
            />
          </div>
          <div style={{ color: "white", padding: "5px" }}>
            {loading === true ? "Transaction in progess......." : ""}
          </div>
          <div style={{ color: "red", padding: "5px" }}>
            {error.length > 0 ? error : ""}
          </div>
          <div style={{ color: "cyan", padding: "5px" }}>
            {message.length > 0 ? message : ""}
          </div>
          <button onClick={sendEthToAnotherAddr} className="button">
            Send Payment
          </button>
        </div>

        <div className="inner__box">
          <div className="text">Send Ether to Contract</div>
          <div>
            <input
              ref={etherAmountRef}
              className="input"
              placeholder="Enter amount in ether"
            />
          </div>
          <div style={{ color: "white", padding: "5px" }}>
            {loading1 === true ? "Transaction in progess......." : ""}
          </div>
          <div style={{ color: "red", padding: "5px" }}>
            {error1.length > 0 ? error1 : ""}
          </div>
          <div style={{ color: "cyan", padding: "5px" }}>
            {message1.length > 0 ? message1 : ""}
          </div>
          <button onClick={sendEthToContract} className="button">
            Send Payment
          </button>
        </div>
      </div>
    </div>
  );
}
