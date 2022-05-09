import React, { useEffect, useState, useRef } from "react";
import { BigNumber, ethers, providers } from "ethers";
import abi from "../utils/payment.json";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import axios from "axios";
import Web3 from "web3";

export default function Home() {
  const contractAddress = "0xE68C05dD79bF80f958AD4D453142b9Ad099b825B";

  const contractABI = abi.abi;
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [balance, setBalance] = useState(0);
  const [contractBalance, setContractBalance] = useState(0);
  const [price, setPrice] = useState(0);

  const [loading1, setLoading1] = useState(false);
  const [error1, setError1] = useState("");
  const [message1, setMessage1] = useState("");

  const etherRef = useRef();
  const etherAmountRef = useRef();
  const walletRef = useRef();

  const web3ModalRef = useRef();
  let provider;
  let web3Modal;

  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: "", // required
      },
    },
    binancechainwallet: {
      package: true,
    },
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object

    web3Modal = new Web3Modal({
      network: "bsc", // optional
      cacheProvider: true, // optional
      providerOptions, // required
    });

    provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Mainnet network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    // rinkbey - 4
    // bsc - 97
    // polygon - 80001
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
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

    setLoading(true);

    const provider = await getProviderOrSigner();
    const signer = provider.getSigner();

    const paymentContract = new ethers.Contract(
      contractAddress,
      contractABI,
      signer
    );

    const walletAddress = walletRef.current.value;
    const ethAmount = etherRef.current.value;

    try {
      const Txn = await paymentContract.sendPayment(walletAddress, {
        gasLimit: 300000,
        value: ethers.utils.parseEther(ethAmount),
      });

      await Txn.wait();

      setLoading(false);
      setMessage("Payment was successful");
      const prov = await getProviderOrSigner();
      const bal = await prov.getBalance(address);
      setBalance(Number(BigNumber.from(bal)) / 10 ** 18);

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
  };

  const sendEthToContract = async () => {
    setError1("");
    setMessage1("");

    if (etherAmountRef.current.value === "") {
      return setError1("Please enter ether amount");
    }

    if (etherAmountRef.current.value <= 0) {
      return setError1("You cant send zero or less than zero ethers");
    }

    setLoading1(true);
    const provider = await getProviderOrSigner();
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
      const bal = await provider.getBalance(address);
      setBalance(Number(BigNumber.from(bal)) / 10 ** 18);

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
  };

  const getPrice = async () => {
    const data = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );

    setPrice(data.data.ethereum.usd);
  };

  const getBalance = async () => {
    try {
      //setLoading(true);
      const provider = await getProviderOrSigner();
      const signer = provider.getSigner();

      const paymentContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      const contractBalance = await paymentContract.getBalance();

      setContractBalance(Number(BigNumber.from(contractBalance)) / 10 ** 18);
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      // When used for the first time, it prompts the user to connect their wallet
      const prov = await getProviderOrSigner();

      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();

      setAddress(accounts[0]);

      const bal = await prov.getBalance(accounts[0]);

      setBalance(Number(BigNumber.from(bal)) / 10 ** 18);

      // track when wallet is connected
      localStorage.setItem("wall", "true");

      // Subscribe to accounts change
      provider.on("accountsChanged", async (accounts) => {
        const provider = await getProviderOrSigner();
        const bal = await provider.getBalance(accounts[0]);
        setAddress(accounts[0]);
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
    } catch (err) {
      console.error(err);
    }
  };

  const disconnectWallet = async () => {
    localStorage.removeItem("wall");
    web3Modal = new Web3Modal({
      network: "rinkeby", // optional
      cacheProvider: true, // optional
      providerOptions, // required
    });
    await web3Modal.clearCachedProvider();
    setAddress("");
  };

  useEffect(() => {
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

    setBalance(0);
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
  }, [address]);

  useEffect(() => {
    getBalance();
    getPrice();
  }, []);

  return (
    <div
      className="bd"
      style={{
        backgroundImage: `url("./images/pay.jpg")`,
        backgroundSize: "cover",
      }}
    >
      <div
        style={{
          marginTop: "50px",
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
          </div>
        ) : (
          <button className="button" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>

      <div className="balance">
        <div>
          Balance <div>{balance.toFixed(4)} ether</div>
          <div>${(balance * price).toFixed(2)}</div>
        </div>

        <div>
          Contract balance <div>{contractBalance} ether</div>
          <div>${(contractBalance * price).toFixed(2)}</div>
        </div>
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
          <div style={{ color: "blue", padding: "5px" }}>
            {loading === true ? "Transaction in progess......." : ""}
          </div>
          <div style={{ color: "red", padding: "5px" }}>
            {error.length > 0 ? error : ""}
          </div>
          <div style={{ color: "blue", padding: "5px" }}>
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
          <div style={{ color: "blue", padding: "5px" }}>
            {loading1 === true ? "Transaction in progess......." : ""}
          </div>
          <div style={{ color: "red", padding: "5px" }}>
            {error1.length > 0 ? error1 : ""}
          </div>
          <div style={{ color: "blue", padding: "5px" }}>
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
