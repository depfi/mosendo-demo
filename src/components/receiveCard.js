import React, { Component } from "react";
import Button from "@material-ui/core/Button";
import ReceiveIcon from "@material-ui/icons/SaveAlt";
import TextField from "@material-ui/core/TextField";
import Tooltip from "@material-ui/core/Tooltip";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Typography from "@material-ui/core/Typography";
//import CopyIcon from "@material-ui/icons/FileCopy";
import QRGenerate from "./qrGenerate";
//import IconButton from "@material-ui/core/IconButton";
//import HighlightOffIcon from "@material-ui/icons/HighlightOff";
//import { withRouter } from "react-router-dom";
import { withStyles, Grid } from "@material-ui/core";
import Snackbar from "./snackBar";
import BN from "bn.js";
import Web3 from "web3";
import { getAmountInUSD } from "../utils/currencyFormatting";
import { emptyAddress } from "connext/dist/Utils";
import AppBarComponent from "./AppBar";

const styles = theme => ({
  icon: {
    width: "40px",
    height: "40px"
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
});

class ReceiveCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      amountToken: null,
      displayValue: "",
      error: null,
      qrUrl: this.generateQrUrl("0"),
      copied: false
    };
  }

  handleClick = async () => {
    this.setState({ copied: false });
  };

  handleCopy = () => {
    const error = this.validatePayment()
    if (error) {
      this.setState({ copied: false })
      return
    }
    this.setState({ copied: true })
  }

  validatePayment = () => {
    const { amountToken, } = this.state
    const { connextState, maxTokenDeposit, } = this.props
    let error = null
    this.setState({ error: null })
    if (!amountToken) {
      error = "Please enter a valid amount"
      this.setState({ error })
      return error
    }
    const tokenBig = new BN(amountToken)
    const amount = {
      amountWei: '0',
      amountToken: maxTokenDeposit,
    }
    if (tokenBig.gt(new BN(amount.amountToken))) {
      error = `Channel balances are capped at ${getAmountInUSD(amount, connextState)}`
    }
    if (tokenBig.isZero() || tokenBig.isNeg()) {
      error = "Please enter a payment amount above 0"
    }

    this.setState({ error })
    return error
  }

  updatePaymentHandler = async value => {
    // appears to be just value
    const token = value ? value : "0"
    // protect against precision errors
    const decimal = (
      value.startsWith('.') ? value.substr(1) : value.split('.')[1]
    )

    let error = null
    let tokenVal = value
    if (decimal && decimal.length > 18) {
      tokenVal = value.startsWith('.') ? value.substr(0, 19) : value.split('.')[0] + '.' + decimal.substr(0, 18)
      error = `Value too precise! Using ${tokenVal}`
    }
    this.setState({
      qrUrl: this.generateQrUrl(value),
      amountToken: Web3.utils.toWei(tokenVal, "ether"),
      displayValue: value,
      error,
    });
  };

  generateQrUrl = value => {
    const { publicUrl, address } = this.props;
    // function should take a payment value
    // and convert it to the url with
    // appropriate strings to prefill a send
    // modal state (recipient, amountToken)
    const url = `${publicUrl || "https:/"}/send?amountToken=${value || "0"}&recipient=${address || emptyAddress}`;
    return url;
  };

  render() {
    const { classes } = this.props;
    const { qrUrl, error, displayValue, amountToken, copied, address } = this.state;
    return (
      <>
        <AppBarComponent address={address} isBack isSetting={false} />
        <Grid
          container
          spacing={16}
          direction="column"
          style={{
            paddingLeft: "5%",
            paddingRight: "5%",
            paddingBottom: "10%",
            textAlign: "center",
            justifyContent: "center"
          }}
        >
          <Snackbar
            handleClick={this.handleClick}
            onClose={this.handleClick}
            open={copied}
            text="Copied!"
          />
          <Grid item xs={12}>
            <div style={{ margin: '10% 0 8px 0' }}>
              <input
                id="outlined-number"
                value={displayValue}
                type="number"
                onChange={evt => this.updatePaymentHandler(evt.target.value)}
                placeholder='Amount...'
                className={classes.amountStyle}
              />
              {error !== null && (
                <div
                  style={{
                    padding: '5px 24px',
                    color: 'red',
                    fontWeight: '300',
                    fontSize: '13px',
                  }}
                >
                  <span>{error}</span>
                </div>
              )}
            </div>
          </Grid>
          <Grid item xs={12} style={{ margin: '15% 0 5%' }}>
            <QRGenerate value={qrUrl} fgColor={'#9053AB'} size={192} />
          </Grid>
          <Grid item xs={12}>
            {/* <CopyIcon style={{marginBottom: "2px"}}/> */}
            <CopyToClipboard
              onCopy={this.handleCopy}
              text={(error === null || error.indexOf('too precise') !== -1) && amountToken !== null ? qrUrl : ''}
            >
              <div
                style={{
                  fontWeight: '300',
                  fontSize: '24px',
                  textAlign: 'center',
                  padding: '0 10%',
                }}
              >
                <Typography noWrap variant="body1">
                  <Tooltip
                    disableFocusListener
                    disableTouchListener
                    title="Click to Copy"
                  >
                    <span onClick={this.validatePayment} style={{ cursor: 'pointer' }}>
                      {qrUrl}
                    </span>
                  </Tooltip>
                </Typography>
                <div
                  style={{
                    fontWeight: '500',
                    fontSize: '13px',
                    textAlign: 'right',
                    paddingTop: '5%',
                  }}
                >
                  <Typography noWrap variant="body1">
                    <Tooltip
                      disableFocusListener
                      disableTouchListener
                      title="Click to Copy"
                    >
                      <span
                        style={{ color: '#9053AB', cursor: 'pointer' }}
                        onClick={this.validatePayment}
                      >
                        Copy Link
                      </span>
                    </Tooltip>
                  </Typography>
                </div>
              </div>
            </CopyToClipboard>
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(ReceiveCard);
