import React, { Component } from "react";
import Button from "@material-ui/core/Button";
//import IconButton from "@material-ui/core/IconButton";
//import HighlightOffIcon from "@material-ui/icons/HighlightOff";
//import { withRouter } from "react-router-dom";
import Tooltip from "@material-ui/core/Tooltip";
// import InputAdornment from "@material-ui/core/InputAdornment";
import Modal from "@material-ui/core/Modal";
//import CircularProgress from "@material-ui/core/CircularProgress";
import QRScan from "./qrScan";
import { withStyles, Grid, Typography } from "@material-ui/core";
import { getChannelBalanceInUSD } from "../utils/currencyFormatting";
import interval from "interval-promise";
import ChannelCard from "./channelCard";
import AppBarComponent from "./AppBar";

const camQR = require("../assets/camQR.png");
const camQRError = require("../assets/camQRError.png");

const styles = theme => ({
  icon: {
    width: "40px",
    height: "40px"
  },
  button: {
    backgroundColor: "#FCA311",
    color: "#FFF"
  },
  modal: {
    position: "absolute",
    top: "-400px",
    left: "150px",
    width: theme.spacing.unit * 50,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing.unit * 4,
    outline: "none"
  },
  addressStyle: {
    width: '89%',
    height: '50px',
    border: 'none',
    boxSizing: 'border-box',
    borderRadius: '24px',
    padding: '15px 12px 12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#7F4998',
    outline: 'none',
    '&::placeholder': {
      color: '#7F4998',
      mixBlendMode: 'normal',
      opacity: '0.5',
    },
  },
  addressStyleError: {
    width: '89%',
    height: '50px',
    border: 'none',
    boxSizing: 'border-box',
    borderRadius: '24px',
    padding: '15px 12px 12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#F36C6C',
    outline: 'none',
    '&::placeholder': {
      color: '#F36C6C',
      mixBlendMode: 'normal',
      opacity: '0.5',
    },
  },
  buttomCash: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '500',
    heigth: '48px',
    boxShadow: 'none',
    backgroundColor: '#B768D4',
    backgroundImage: 'linear-gradient(to right, #8F52AA , #B768D4)',
    borderRadius: '24px',
    '&:disabled': {
      color: '#ffffff',
      cursor: 'not-allowed'
    }
  }
});

class CashOutCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      withdrawalVal: {
        withdrawalWeiUser: "0",
        tokensToSell: "0",
        withdrawalTokenUser: "0",
        weiToSell: "0",
        recipient: "0x0..."
      },
      addressError: null,
      balanceError: null,
      scan: false,
      withdrawEth: true,
      aggregateBalance: "0.00",
      withdrawing: false
    };
  }

  async updateWithdrawalVals(withdrawEth) {
    this.setState({ withdrawEth });

    // set the state to contain the proper withdrawal args for
    // eth or dai withdrawal
    const { channelState, exchangeRate } = this.props;
    let { withdrawalVal } = this.state;
    if (withdrawEth) {
      // withdraw all channel balance in eth
      withdrawalVal = {
        ...withdrawalVal,
        exchangeRate,
        tokensToSell: channelState.balanceTokenUser,
        withdrawalWeiUser: channelState.balanceWeiUser,
        weiToSell: "0",
        withdrawalTokenUser: "0"
      };
    } else {
      // handle withdrawing all channel balance in dai
      withdrawalVal = {
        ...withdrawalVal,
        exchangeRate,
        tokensToSell: "0",
        withdrawalWeiUser: "0",
        weiToSell: channelState.balanceWeiUser,
        withdrawalTokenUser: channelState.balanceTokenUser
      };
    }

    this.setState({ withdrawalVal });
    return withdrawalVal;
  }

  // examines if the display value should be updated
  // when the component is mounting, or when the props change

  // NOTE: the amount to cashout != channel card amount if there is
  // wei in the channel
  async updateDisplayValue() {
    const { channelState, connextState } = this.props;
    if (
      !channelState ||
      (channelState.balanceWeiUser === "0" &&
        channelState.balanceTokenUser === "0")
    ) {
      this.setState({ aggregateBalance: "$0.00" });
      return;
    }

    const usd = getChannelBalanceInUSD(channelState, connextState, false);

    this.setState({ aggregateBalance: usd });
  }

  // update display value with the exchange rate/
  // channel balance changes
  async componentWillReceiveProps() {
    await this.updateDisplayValue();
  }

  async componentDidMount() {
    await this.updateDisplayValue();
  }

  async updateRecipientHandler(value) {
    if (value.includes("ethereum:")) {
      let temp = value.split(":")
      value = temp[1]
    }
    this.setState({
      recipientDisplayVal: value,
      scan: false
    });
    await this.setState(oldState => {
      oldState.withdrawalVal.recipient = value;
      return oldState;
    });
  }

  async checkState() {
    const { channelState } = this.props;
    if (channelState.pendingWithdrawalWeiUser !== "0") {
      return true;
    } else {
      return false;
    }
  }

  poller = async () => {
    await interval(
      async (iteration, stop) => {
        const { runtime } = this.props

        if (!runtime.awaitingOnchainTransaction) {
          stop()
        }
      },
      1000,
    )
    this.setState({ withdrawing: false })
    this.props.history.push("/")
  };

  async withdrawalHandler(withdrawEth) {
    const { connext, web3 } = this.props;
    const withdrawalVal = await this.updateWithdrawalVals(withdrawEth);
    this.setState({ addressError: null, balanceError: null });
    // check for valid address
    // let addressError = null
    // let balanceError = null
    if (!web3.utils.isAddress(withdrawalVal.recipient)) {
      const addressError = `${
        withdrawalVal.recipient === "0x0..."
          ? "Must provide address."
          : withdrawalVal.recipient + " is an invalid address"
      }`;
      this.setState({ addressError });
      return;
    }
    // check the input balance is under channel balance
    // TODO: allow partial withdrawals?
    //invoke withdraw modal
    this.setState({ withdrawing: true });

    console.log(`Withdrawing: ${JSON.stringify(withdrawalVal, null, 2)}`);
    await connext.withdraw(withdrawalVal);

    this.poller();
  }

  render() {
    const { classes, exchangeRate, connextState, address, channelState } = this.props;
    const {
      recipientDisplayVal,
      addressError,
      scan,
      // aggregateBalance /*, withdrawing*/
    } = this.state;
    return (
      <>
        <AppBarComponent address={address} isBack/>
        <Grid container direction="row" style={{ marginBottom: "-7.5%" }}>
          <Grid item xs={12}
            style={{ flexGrow: 1 }}
          >
            <ChannelCard
              channelState={channelState}
              address={address}
              connextState = {connextState}
              marginBottom='16%'
            />
          </Grid>
        </Grid>
        <Grid
          container
          spacing={16}
          direction="column"
          style={{
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: "10%",
            paddingBottom: "10%",
            textAlign: "center",
            justifyContent: "center"
          }}
        >
          {/* <ProgressModalWrapped withdrawing={withdrawing} /> */}
          <Grid item xs={12} style={{ textAlign: 'left' }}>
            <Typography variant="body2">
              <span
                style={{
                  fontStyle: 'italic',
                  fontWeight: '300',
                  fontSize: '13px',
                }}
              >
                {"ETH price: $" + exchangeRate}
              </span>
            </Typography>
          </Grid>
          <Grid item xs={12} style={{ marginTop: '10%', textAlign: 'left' }}>
            <div
              style={{
                borderRadius: '24px',
                border: `${addressError !== null ? '1px solid #F36C6C' : '1px solid #7F4998'}`
              }}
            >
              <input
                id="outlined-with-placeholder"
                type="string"
                value={recipientDisplayVal || ""}
                onChange={evt => this.updateRecipientHandler(evt.target.value)}
                placeholder='Recipient Address...'
                autoComplete="off"
                required
                className={addressError !== null ? classes.addressStyleError : classes.addressStyle}
              />
              <Tooltip
                disableFocusListener
                disableTouchListener
                title="Scan with QR code"
              >
                <span
                  style={{ verticalAlign: 'sub', cursor: 'pointer' }}
                  onClick={() => this.setState({ scan: true })}
                >
                  <img
                    src={addressError === null ? camQR : camQRError}
                    alt=""
                    style={{ width: "24px", height: "24px" }}
                  />
                </span>
              </Tooltip>
            </div>
            {addressError !== null && (
              <div
                style={{
                  padding: '5% 24px',
                  color: '#F36C6C',
                  fontWeight: '300',
                  fontSize: '13px',
                  textAlign: 'center'
                }}
              >
                <span>
                  *{addressError}
                </span>
              </div>
            )}
          </Grid>
          <Modal
            id="qrscan"
            open={scan}
            onClose={() => this.setState({ scan: false })}
            style={{
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              position: "absolute",
              top: "10%",
              width: "375px",
              marginLeft: "auto",
              marginRight: "auto",
              left: "0",
              right: "0"
            }}
          >
            <QRScan
              handleResult={this.updateRecipientHandler.bind(this)}
              history={this.props.history}
            />
          </Modal>
          <Grid item xs={12} style={{ marginTop: '23%' }}>
            <Button
              className={classes.buttomCash}
              fullWidth
              onClick={() => this.withdrawalHandler(true)}
              disabled={!connextState || !connextState.runtime.canWithdraw}
            >
              Cash Out Dai
            </Button>
          </Grid>
          <Grid item xs={12} style={{ display: 'none' }}>
            <Button
              className={classes.buttomCash}
              variant="contained"
              fullWidth
              onClick={() => this.withdrawalHandler(false)}
              disabled
            >
              Cash Out Dai
            </Button>
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(CashOutCard);
