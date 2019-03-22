import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import Tooltip from "@material-ui/core/Tooltip";
import Modal from "@material-ui/core/Modal";
import AppBarComponent from "./AppBar";
import ChannelCard from "./channelCard";
import QRScan from "./qrScan";
import {
  withStyles,
  Grid,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@material-ui/core";
import { emptyAddress } from "connext/dist/Utils";
import { convertPayment } from "connext/dist/types";
import BN from "bn.js";
import interval from "interval-promise";
import Web3 from "web3";

const queryString = require("query-string");
// $10 capped linked payments
const LINK_LIMIT = Web3.utils.toBN(Web3.utils.toWei("10", "ether"));
const camQR = require("../assets/camQR.png");

const styles = theme => ({
  icon: {
    width: "40px",
    height: "40px"
  },
  input: {
    width: "100%"
  },
  buttonSend: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500',
    heigth: '48px',
    marginTop: "20%",
    boxShadow: 'none',
    backgroundColor: '#B768D4',
    backgroundImage: 'linear-gradient(to right, #8F52AA , #B768D4)',
    borderRadius: '24px',
    textTransform: 'none',
  },
  linkCSS: {
    color: '#8F52AA',
    fontSize: '16px',
    fontWeight: '500',
    textAlign: 'center',
    margin: "13% 0 25%",
  },
  amountStyle: {
    width: '100%',
    height: '50px',
    border: '1px solid #7F4998',
    boxSizing: 'border-box',
    borderRadius: '24px',
    padding: '15px 24px 12px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#7F4998',
    '&::placeholder': {
      color: '#7F4998',
      mixBlendMode: 'normal',
      opacity: '0.5',
    },
    outline: 'none',
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
    '&::placeholder': {
      color: '#7F4998',
      mixBlendMode: 'normal',
      opacity: '0.5',
    },
    outline: 'none',
  }
});

const PaymentStates = {
  None: 0,
  Collateralizing: 1,
  CollateralTimeout: 2,
  OtherError: 3,
  Success: 4
};

// possible returns of requesting collateral
// payment succeeded
// monitoring requests timed out, still no collateral
// appropriately collateralized
const CollateralStates = {
  PaymentMade: 0,
  Timeout: 1,
  Success: 2
};

function ConfirmationDialogText(paymentState, amountToken, recipient) {
  switch (paymentState) {
    case PaymentStates.Collateralizing:
      return (
        <Grid>
          <DialogTitle disableTypography>
            <Typography variant="h5" color="primary">
              Payment In Process
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant="body1" style={{ color: "#0F1012", margin: "1em" }}>
              Recipient's Card is being set up. This should take 20-30 seconds.
            </DialogContentText>
            <DialogContentText variant="body1" style={{ color: "#0F1012" }}>
              If you stay on this page, your payment will be retried automatically.
              If you navigate away or refresh the page, you will have to attempt the payment again yourself.
            </DialogContentText>
          <CircularProgress style={{ marginTop: "1em" }} />
          </DialogContent>
        </Grid>
      );
    case PaymentStates.CollateralTimeout:
      return (
        <Grid>
          <DialogTitle disableTypography>
            <Typography variant="h5" style={{ color: "#F22424" }}>
            Payment Failed
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant="body1" style={{ color: "#0F1012", margin: "1em" }}>
            After some time, recipient channel could not be initialized.
            </DialogContentText>
            <DialogContentText variant="body1" style={{ color: "#0F1012" }}>
            Is the receiver online to set up their Card? Please try your payment again later. If
              you have any questions, please contact support. (Settings -->
              Support)
            </DialogContentText>
          </DialogContent>
        </Grid>
      );
    case PaymentStates.OtherError:
      return (
        <Grid>
          <DialogTitle disableTypography>
            <Typography variant="h5" style={{ color: "#F22424" }}>
            Payment Failed
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant="body1" style={{ color: "#0F1012", margin: "1em" }}>
            An unknown error occured when making your payment.
            </DialogContentText>
            <DialogContentText variant="body1" style={{ color: "#0F1012" }}>
            Please try again in 30s and contact support if you continue to
              experience issues. (Settings --> Support)
            </DialogContentText>
          </DialogContent>
        </Grid>
      );
    case PaymentStates.Success:
      return (
        <Grid>
          <DialogTitle disableTypography>
            <Typography variant="h5" style={{ color: "#009247" }}>
            Payment Success!
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant="body1" style={{ color: "#0F1012", margin: "1em" }}>
            Amount: ${amountToken}
            </DialogContentText>
            <DialogContentText variant="body1" style={{ color: "#0F1012" }}>
            To: {recipient.substr(0, 5)}...
            </DialogContentText>
          </DialogContent>
        </Grid>
      );
    case PaymentStates.None:
    default:
      return <div />;
  }
}

const PaymentConfirmationDialog = props => (
  <Dialog
    open={props.showReceipt}
    onBackdropClick={
      props.paymentState === PaymentStates.Collateralizing
        ? null
        : () => props.closeModal()
    }
    fullWidth
    style={{
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
    }}
  >
    <Grid
      container
      style={{
        backgroundColor: "#FFF",
        paddingTop: "10%",
        paddingBottom: "10%"
      }}
      justify="center"
    >
      {ConfirmationDialogText(
        props.paymentState,
        props.amountToken,
        props.recipient
      )}
      {props.paymentState === PaymentStates.Collateralizing ? (
        <></>
      ) : (
        <DialogActions>
          <Button
            color="primary"
            variant="outlined"
            size="medium"
            onClick={() => props.closeModal()}
          >
            Pay Again
          </Button>
          <Button
            style={{
              background: "#FFF",
              border: "1px solid #F22424",
              color: "#F22424",
              marginLeft: "5%"
            }}
            variant="outlined"
            size="medium"
            onClick={() => props.history.push("/")}
          >
            Home
          </Button>
        </DialogActions>
      )}
    </Grid>
  </Dialog>
);

class PayCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      paymentVal: {
        meta: {
          purchaseId: "payment"
          // memo: "",
        },
        payments: [
          {
            recipient: props.scanArgs.recipient
              ? props.scanArgs.recipient
              : "",
            amount: {
              amountToken: props.scanArgs.amount
                ? Web3.utils.toWei(props.scanArgs.amount)
                : "0",
              amountWei: "0"
            },
            type: "PT_CHANNEL"
          }
        ]
      },
      addressError: null,
      balanceError: null,
      paymentState: PaymentStates.None,
      scan: false,
      displayVal: props.scanArgs.amount ? props.scanArgs.amount : "",
      showReceipt: false
    };
  }

  async componentDidMount() {
    const { location } = this.props;
    const query = queryString.parse(location.search);
    if (query.amountToken) {
      await this.setState(oldState => {
        oldState.paymentVal.payments[0].amount.amountToken = Web3.utils.toWei(
          query.amountToken
        );
        oldState.displayVal = query.amountToken;
        return oldState;
      });
    }
    if (query.recipient) {
      await this.setState(oldState => {
        oldState.paymentVal.payments[0].recipient = query.recipient;
        return oldState;
      });
    }
  }

  async updatePaymentHandler(value) {
    // if there are more than 18 digits after the decimal, do not
    // count them.
    // throw a warning in the address error
    let balanceError = null
    const decimal = (
      value.startsWith('.') ? value.substr(1) : value.split('.')[1]
    )

    let tokenVal = value
    if (decimal && decimal.length > 18) {
      tokenVal = value.startsWith('.') ? value.substr(0, 19) : value.split('.')[0] + '.' + decimal.substr(0, 18)
      balanceError = `Value too precise! Using ${tokenVal}`
    }
    await this.setState(oldState => {
      oldState.paymentVal.payments[0].amount.amountToken = value
        ? Web3.utils.toWei(`${tokenVal}`, "ether")
        : "0";
      if (balanceError) {
        oldState.balanceError = balanceError;
      }
      return oldState;
    });

    this.setState({ displayVal: value, });
  }

  handleQRData = async scanResult => {
    const { publicUrl } = this.props;

    let data = scanResult.split("/send?");
    if (data[0] === publicUrl) {
      let temp = data[1].split("&");
      let amount = temp[0].split("=")[1];
      let recipient = temp[1].split("=")[1];
      this.updatePaymentHandler(amount);
      this.updateRecipientHandler(recipient);
    } else {
      this.updateRecipientHandler(scanResult);
      console.log("incorrect site");
    }
    this.setState({
      scan: false
    });
  };

  async updateRecipientHandler(value) {
    this.setState(async oldState => {
      oldState.paymentVal.payments[0].recipient = value;

      return oldState;
    });
  }

  // validates recipient and payment amount
  // also sets the variables of these values in the state
  // returns the values it sets, to prevent async weirdness
  validatePaymentInput(paymentVal) {
    const address = paymentVal.payments[0].recipient;
    const payment = convertPayment("bn", paymentVal.payments[0].amount);
    const { channelState } = this.props;
    this.setState({ addressError: null, balanceError: null });

    let balanceError = null
    let addressError = null
    // validate that the token amount is within bounds
    if (payment.amountToken.gt(new BN(channelState.balanceTokenUser))) {
      balanceError = "Insufficient balance in channel";
    }
    if (payment.amountToken.isZero() || payment.amountToken.isNeg()) {
      balanceError = "Please enter a payment amount above 0";
    }

    // validate recipient is valid address OR the empty address
    // recipient address can be empty
    const isLink = paymentVal.payments[0].type === "PT_LINK";
    const isValidRecipient =
      Web3.utils.isAddress(address) &&
      (isLink ? address === emptyAddress : address !== emptyAddress);

    if (!isValidRecipient) {
      addressError = "Please choose a valid address";
    }

    // linked payments also have a maximum enforced
    if (isLink && payment.amountToken.gt(LINK_LIMIT)) {
      // balance error here takes lower precendence than preceding
      // balance errors, only reset if undefined
      balanceError = balanceError || "Linked payments are capped at $10.";
    }
    this.setState({ balanceError, addressError });

    return { balanceError, addressError };
  }

  async linkHandler() {
    const { connext } = this.props;
    const { paymentVal } = this.state;

    // generate secret, set type, and set
    // recipient to empty address
    const payment = {
      ...paymentVal.payments[0],
      type: "PT_LINK",
      recipient: emptyAddress,
      secret: connext.generateSecret()
    };

    const updatedPaymentVal = {
      ...paymentVal,
      payments: [payment]
    };

    // unconditionally set state
    this.setState({
      paymentVal: updatedPaymentVal
    });

    // check for validity of input fields
    const { balanceError, addressError } = this.validatePaymentInput(
      updatedPaymentVal
    );

    if (addressError || balanceError) {
      return;
    }

    // send payment
    await this._sendPayment(updatedPaymentVal);
  }

  async paymentHandler() {
    const { connext } = this.props;
    const { paymentVal } = this.state;
    // check if the recipient needs collateral
    const needsCollateral = await connext.recipientNeedsCollateral(
      paymentVal.payments[0].recipient,
      convertPayment("str", paymentVal.payments[0].amount)
    );
    // do not send collateral request if it is not valid
    // check if the values are reasonable
    // before beginning the request for collateral
    const { balanceError, addressError } = this.validatePaymentInput(
      paymentVal
    );
    if (addressError || balanceError) {
      return;
    }

    // needs collateral can indicate that the recipient does
    // not have a channel, or that it does not have current funds
    // in either case, you need to send a failed payment
    // to begin auto collateralization process
    if (needsCollateral) {
      // this can have 3 potential outcomes:
      // - collateralization failed (return)
      // - payment succeeded (return)
      // - channel collateralized
      const collateralizationStatus = await this.collateralizeRecipient(
        paymentVal
      );
      switch (collateralizationStatus) {
        // setting state for these cases done in collateralize
        case CollateralStates.PaymentMade:
        case CollateralStates.Timeout:
          return;
        case CollateralStates.Success:
        default:
        // send payment via fall through
      }
    }

    // send payment
    await this._sendPayment(paymentVal);
  }

  async collateralizeRecipient(paymentVal) {
    const { connext } = this.props;
    // do not collateralize on pt link payments
    if (paymentVal.payments[0].type === "PT_LINK") {
      return;
    }

    // collateralize otherwise
    this.setState({
      paymentState: PaymentStates.Collateralizing,
      showReceipt: true
    });

    // collateralize by sending payment
    const err = await this._sendPayment(paymentVal, true);
    // somehow it worked???
    if (!err) {
      this.setState({
        showReceipt: true,
        paymentState: PaymentStates.Success
      });
      return CollateralStates.PaymentMade;
    }

    // call to send payment failed, monitor collateral
    // watch for confirmation on the recipients side
    // of the channel for 20s
    let needsCollateral
    await interval(
      async (iteration, stop) => {
        // returns null if no collateral needed
        needsCollateral = await connext.recipientNeedsCollateral(
          paymentVal.payments[0].recipient,
          convertPayment("str", paymentVal.payments[0].amount)
        );
        if (!needsCollateral || iteration > 20) {
          stop();
        }
      },
      5000,
      { iterations: 20 }
    );

    if (needsCollateral) {
      this.setState({
        showReceipt: true,
        paymentState: PaymentStates.CollateralTimeout
      });
      return CollateralStates.Timeout;
    }

    return CollateralStates.Success;
  }

  // returns a string if there was an error, null
  // if successful
  async _sendPayment(paymentVal, isCollateralizing = false) {
    const { connext } = this.props;

    const { balanceError, addressError } = this.validatePaymentInput(
      paymentVal
    );
    // return if either errors exist
    // state is set by validator
    // mostly a sanity check, this should be done before calling
    // this function
    if (balanceError || addressError) {
      return;
    }

    // collateralizing is handled before calling this send payment fn
    // by either payment or link handler
    // you can call the appropriate type here
    try {
      await connext.buy(paymentVal);
      if (paymentVal.payments[0].type === "PT_LINK") {
        // automatically route to redeem card
        const secret = paymentVal.payments[0].secret;
        const amount = paymentVal.payments[0].amount;
        this.props.history.push({
          pathname: "/redeem",
          // TODO: add wei
          search: `?secret=${secret}&amountToken=${
            Web3.utils.fromWei(amount.amountToken, "ether")
          }`,
          state: { isConfirm: true, secret, amount }
        });
      } else {
        // display receipts
        this.setState({
          showReceipt: true,
          paymentState: PaymentStates.Success
        });
      }
      return null;
    } catch (e) {
      if (!isCollateralizing) {
        // only assume errors if collateralizing
        console.log("Unexpected error sending payment:", e);
        this.setState({
          paymentState: PaymentStates.OtherError,
          showReceipt: true
        });
      }
      // setting state for collateralize handled in 'collateralizeRecipient'
      return e.message;
    }
  }

  closeModal = () => {
    this.setState({ showReceipt: false, paymentState: PaymentStates.None });
  };

  render() {
    const { classes, channelState, connextState, address } = this.props;
    const { paymentState } = this.state;
    return (
      <>
        <AppBarComponent address={address} isBack/>
        <Grid container direction="row">
          <Grid item xs={12}
            style={{ flexGrow: 1 }}
          >
            <ChannelCard
              channelState={channelState}
              address={address}
              connextState = {connextState}
              marginBottom='5%'
            />
          </Grid>
        </Grid>
        <Grid
          container
          spacing={16}
          direction="column"
          style={{
            display: "flex",
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: "6%",
            paddingBottom: "10%",
            justify: "center"
          }}
        >
          <Grid item xs={12}>
            <Typography variant="body2">
              <span
                style={{
                  fontStyle: 'italic',
                  fontWeight: '300',
                  fontSize: '13px',
                }}
              >
                {"* Linked payments are capped at $10 *"}
              </span>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <div style={{ margin: '10% 0 8px 0' }}>
              <input
                id="outlined-number"
                value={this.state.displayVal}
                type="number"
                onChange={evt => this.updatePaymentHandler(evt.target.value)}
                placeholder='Amount...'
                className={classes.amountStyle}
              />
              {this.state.balanceError !== null && (
                <div
                  style={{
                    padding: '5px 24px',
                    color: 'red',
                    fontWeight: '300',
                    fontSize: '13px',
                  }}
                >
                  <span>{this.state.balanceError}</span>
                </div>
              )}
            </div>
          </Grid>
          <Grid item xs={12}>
            <div
              style={{
                border: '1px solid #7F4998',
                borderRadius: '24px',
              }}
            >
              <input
                id="outlined"
                type="string"
                value={
                  this.state.paymentVal.payments[0].recipient === emptyAddress
                    ? ""
                    : this.state.paymentVal.payments[0].recipient
                }
                onChange={evt => this.updateRecipientHandler(evt.target.value)}
                placeholder='Recipient Address...'
                className={classes.addressStyle}
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
                    src={camQR}
                    alt=""
                    style={{ width: "24px", height: "24px" }}
                  />
                </span>
              </Tooltip>
            </div>
            {this.state.addressError !== null && (
              <div
                style={{
                  padding: '5px 24px',
                  color: 'red',
                  fontWeight: '300',
                  fontSize: '13px',
                }}
              >
                <span>
                  {
                    this.state.addressError
                      ? this.state.addressError
                      : "Optional for linked payments"
                  }
                </span>
              </div>
            )}
          </Grid>
          <Modal
            id="qrscan"
            open={this.state.scan}
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
              handleResult={this.handleQRData}
              history={this.props.history}
            />
          </Modal>
          <Grid item xs={12}>
            <Typography variant="body2">
              <span
                style={{
                  fontStyle: 'italic',
                  fontWeight: '300',
                  fontSize: '13px',
                }}
              >
                {"* Optional for linked payments *"}
              </span>
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              fullWidth
              className={classes.buttonSend}
              variant="contained"
              size="large"
              disableRipple
              onClick={() => {this.paymentHandler()}}
            >
              Send the money
            </Button>
          </Grid>
          <Grid item xs={12}>
            <div className={classes.linkCSS}>
              <span style={{ cursor: 'pointer' }} onClick={() => {this.linkHandler()}} >
                Send link to redeem money
              </span>
            </div>
          </Grid>
          <PaymentConfirmationDialog
            showReceipt={this.state.showReceipt}
            sendError={this.state.sendError}
            amountToken={
              this.state.paymentVal.payments[0].amount.amountToken
                ? Web3.utils.fromWei(
                    this.state.paymentVal.payments[0].amount.amountToken
                  )
                : "0"
            }
            recipient={this.state.paymentVal.payments[0].recipient}
            history={this.props.history}
            closeModal={this.closeModal}
            paymentState={paymentState}
          />
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(PayCard);
