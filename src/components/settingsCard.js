import React, { Component } from "react";
import {
  Button,
  Grid,
  Select,
  MenuItem,
  Typography,
  Tooltip,
  TextField,
  InputAdornment,
  withStyles,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@material-ui/core";
import { CopyToClipboard } from "react-copy-to-clipboard";
import CopyIcon from "@material-ui/icons/FileCopy";
import SubmitIcon from "@material-ui/icons/ArrowRight";
<<<<<<< HEAD
import { createWallet, createWalletFromMnemonic } from "../walletGen";
import Snackbar from "./snackBar";
=======
import { createWallet, createWalletFromMnemonic } from "../utils/walletGen";
import SettingsIcon from "@material-ui/icons/Settings";
import MySnackbar from "./snackBar";
>>>>>>> 93491514f1a1fd759b19c6a825d49a656577ae2d
import interval from "interval-promise";
import AppBarComponent from "./AppBar";
import QRGenerate from "./qrGenerate";

const styles = {
  card: {
    display: "flex",
    flexWrap: "wrap",
    flexDirection: "row",
    width: "100%",
    height: "70%",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: "4% 4% 4% 4%"
  },
  icon: {
    width: "40px",
    height: "40px"
  },
  input: {
    width: "100%"
  },
  button: {
    marginBottom: "0px",
    width: '167px',
    height: '167px',
    fontWeight: '500',
    fontSize: '24px',
    color: "#7F4998",
    border: "1px solid rgba(127, 73, 152, 0.5)",
    borderRadius: "8px",
    '&:hover' : {
      backgroundColor: 'transparent'
    }
  },
  selectStyle: {
    border: "1px solid rgba(127, 73, 152, 0.5)",
    fontWeight: '500',
    fontSize: '24px',
    color: "#7F4998",
    textAlign: "center",
    width: '167px',
    height: '167px',
    borderRadius: "8px",
    '@global': {
      div: { padding: '0' }
    }
  }
};

class SettingsCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showRecovery: false,
      inputRecovery: false,
      rpc: localStorage.getItem("rpc-prod"),
      mnemonic: '',
      copied: false,
      showWarning: false
    };
  }

  closeModal = async () => {
    await this.setState({ copied: false });
  };

  handleCopy = () => {
    this.setState({ copied: true })
  }

  generateNewAddress = async () => {
    this.setState({ isBurning: true });
    try {
      await this.props.connext.withdraw({
        withdrawalWeiUser: "0",
        tokensToSell: "0",
        withdrawalTokenUser: "0",
        weiToSell: "0",
        recipient: this.props.address,
        exchangeRate: this.props.exchangeRate
      });
    } catch (e) {
      console.log("Error withdrawing, creating new address anyway", e.message);
    } finally {
      await createWallet(this.state.web3);
      this.burnRefreshPoller();
    }
  };

  burnRefreshPoller = async () => {
    await interval(
      async (iteration, stop) => {
        const { runtime } = this.props
          if (!runtime.awaitingOnchainTransaction) {
            stop()
          }
      },
      1000,
      { iterations: 50 }
    );

    // Then refresh the page
    this.props.history.push("/");
    window.location.reload();
  };

  async recoverAddressFromMnemonic() {
    await createWalletFromMnemonic(this.state.mnemonic);
    window.location.reload();
  }

  async updateRPC(event) {
    const rpc = event.target.value;
    this.setState({ rpc });
    await this.props.networkHandler(rpc);
    window.location.reload();
  }

  render() {
    const { classes, address } = this.props;
    const { copied } = this.state;
    return (
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
        <MySnackbar
          variant="success"
          openWhen={copied}
          onClose={() => this.closeModal()}
          message="Copied!"
        />
        <Grid item xs={12} style={{ justifyContent: "center" }}>
          <SettingsIcon className={classes.icon} />
        </Grid>
        <Grid item xs={12}>
          {/* <CopyIcon style={{marginBottom: "2px"}}/> */}
          <CopyToClipboard
            onCopy={this.handleCopy}
            text={address}
          >
            Support
          </Button>
        </Grid>
        <Grid item xs={12} className={classes.button}>
          {!this.state.showRecovery ? (
            <Button
              fullWidth
              className={classes.button}
              variant="outlined"
              color="primary"
              size="large"
              onClick={() => this.setState({ showRecovery: true })}
            >
              Show Backup Phrase
            </Button>
          ) : (
            <CopyToClipboard
              onCopy={() => this.setState({ copied: true })}
              text={localStorage.getItem("mnemonic")}
              color="primary"
            >
              <Typography noWrap variant="body1">
                <Tooltip
                  disableFocusListener
                  disableTouchListener
                  title="Click to Copy"
                >
                  <span style={{ cursor: 'pointer' }}>
                    Address: {address}
                  </span>
                </Tooltip>
              </Typography>
              <div
                style={{
                  fontWeight: '500',
                  textAlign: 'right',
                  padding: '2% 2% 0 0',
                }}
              >
                <Typography noWrap variant="body1">
                  <Tooltip
                    disableFocusListener
                    disableTouchListener
                    title="Click to Copy"
                  >
                    <span
                      style={{
                        color: '#9053AB',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      Copy Address
                    </span>
                  </Tooltip>
                </Typography>
              </div>
            </div>
          </CopyToClipboard>
        </Grid>
        <Grid
          container
          spacing={16}
          direction="column"
          style={{
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: "5%",
            paddingBottom: "8%",
            textAlign: "center",
            justifyContent: "center"
          }}
        >
          <Snackbar
            handleClick={() => this.handleClick()}
            onClose={() => this.handleClick()}
            open={copied}
            text="Copied!"
          />
          <Grid
            container
            spacing={8}
            direction="column"
            style={{ paddingLeft: "2%", paddingRight: "2%", textAlign: "center" }}
          >
            <Grid item xs={12}>
              <Grid
                container
                spacing={8}
                direction="row"
                alignItems="center"
                justify="center"
              >
                <Grid item xs={12} sm='auto'>
                  <Select
                    fullWidth
                    value={this.state.rpc}
                    onChange={event => this.updateRPC(event)}
                    className={classes.selectStyle}
                    disableUnderline
                    IconComponent={() => null}
                  >
                    <MenuItem value={"MAINNET"}>MAINNET</MenuItem>
                    <MenuItem value={"RINKEBY"}>RINKEBY</MenuItem>
                    <MenuItem value={"LOCALHOST"}>LOCALHOST</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} sm='auto'>
                  <Button
                    fullWidth
                    className={classes.button}
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      window.open("https://discord.gg/q2cakRc", "_blank");
                      window.close();
                      return false;
                    }}
                  >
                    Support
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <Grid
                container
                spacing={8}
                direction="row"
                alignItems="center"
                justify="center"
              >
                <Grid item xs={12} sm='auto'>
                  {!this.state.showRecovery ? (
                    <Button
                      fullWidth
                      className={classes.button}
                      style={{ padding: '48px' }}
                      variant="outlined"
                      size="large"
                      onClick={() => this.setState({ showRecovery: true })}
                    >
                      Backup Phrase
                    </Button>
                  ) : (
                    <CopyToClipboard
                      text={localStorage.getItem("mnemonic")}
                      color="primary"
                    >
                      <Button
                        fullWidth
                        className={classes.button}
                        style={{ padding: '48px' }}
                        variant="outlined"
                        size="large"
                        onClick={() => this.setState({ showRecovery: true })}
                      >
                        <CopyIcon style={{ marginRight: "5px" }} />
                        <Typography noWrap variant="body1" color="primary">
                          <Tooltip
                            disableFocusListener
                            disableTouchListener
                            title="Click to Copy"
                          >
                            <span>{localStorage.getItem("mnemonic")}</span>
                          </Tooltip>
                        </Typography>
                      </Button>
                    </CopyToClipboard>
                  )}
                </Grid>
                <Grid item xs={12} sm='auto'>
                  {!this.state.inputRecovery ? (
                    <Button
                      fullWidth
                      className={classes.button}
                      style={{ padding: '48px' }}
                      variant="outlined"
                      size="large"
                      onClick={() => this.setState({ inputRecovery: true })}
                    >
                      Import Card
                    </Button>
                  ) : (
                    <TextField
                      style={{ height: "40px", width: "80%" }}
                      color="primary"
                      variant="outlined"
                      size="large"
                      placeholder="Enter backup phrase and submit"
                      value={this.state.mnemonic}
                      onChange={event =>
                        this.setState({ mnemonic: event.target.value })
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              style={{ color: "#FFF", marginRight: "-10%" }}
                              onClick={() => this.recoverAddressFromMnemonic()}
                            >
                              <SubmitIcon />
                            </Button>
                          </InputAdornment>
                        )
                      }}
                    />
                  )}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} style={{ marginTop: '6%' }}>
            <Button
              fullWidth
              style={{
                background: "#FFF",
                border: '1px solid #F36C6C',
                boxSizing: 'border-box',
                borderRadius: '24px',
                fontWeight: '500',
                fontSize: '16px',
                color: '#F36C6C'
              }}
              size="large"
              onClick={() => this.setState({ showWarning: true })}
            >
              Delete Card
            </Button>
            <Dialog
              open={this.state.showWarning}
              onBackdropClick={() => this.setState({ showWarning: false })}
              fullWidth
              style={{
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <DialogTitle disableTypography>
                <Typography variant="h5" style={{ color: "#F22424" }}>
                Are you sure you want to burn your Card?
                </Typography>
              </DialogTitle>
              <DialogContent>
              {this.state.isBurning ? (
                <Grid item xs={12}>
                  <DialogContentText variant="body1">
                    Burning. Please do not refresh or navigate away. This page
                    will refresh automatically when it's done.
                  </DialogContentText>
                  <CircularProgress style={{ marginTop: "1em" }} />
                  </Grid>
              ) : (
                <Grid container alignItems="center" justify="center" direction="column">
                <Grid item xs={12}>
                    <DialogContentText variant="body1" style={{ color: "#F22424" }}>
                      You will lose access to your funds unless you save your
                      backup phrase!
                    </DialogContentText>
                    <CircularProgress style={{ marginTop: "1em" }} />
                    </Grid>
                ) : (
                  <Grid container alignItems="center" justify="center" direction="column">
                  <Grid item xs={12}>
                      <DialogContentText variant="body1" style={{ color: "#F22424" }}>
                        You will lose access to your funds unless you save your
                        backup phrase!
                      </DialogContentText>
                      </Grid>
                      <Grid item xs={12}>
                    <DialogActions>
                      <Button
                        style={{
                          background: "#F22424",
                          border: "1px solid #F22424",
                          color: "#FFF"
                        }}
                        variant="contained"
                        size="small"
                        onClick={() => this.generateNewAddress()}
                      >
                        Delete
                      </Button>
                      <Button
                        style={{
                          background: "#FFF",
                          border: "1px solid #F22424",
                          color: "#F22424",
                          marginLeft: "5%"
                        }}
                        variant="outlined"
                        size="small"
                        onClick={() => this.setState({ showWarning: false })}
                      >
                        Cancel
                      </Button>
                    </DialogActions>
                    </Grid>
                    </Grid>
                )}
                </DialogContent>

              </Grid>
            </Dialog>
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(SettingsCard);
