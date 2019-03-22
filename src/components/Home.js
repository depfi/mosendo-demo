import React from "react";
import "../App.css";
import ChannelCard from "./channelCard";
import AppBarComponent from "./AppBar";
import QRScan from "./qrScan";
import Modal from "@material-ui/core/Modal";
import Button from "@material-ui/core/Button";
import { Fab, Grid, withStyles } from "@material-ui/core";
import { Link } from "react-router-dom";

const camQR = require("../assets/camQR.png");
const arrowUp = require("../assets/arrowUp.png");
const arrowDown = require("../assets/arrowDown.png");

const styles = theme => ({
  buttonSendRequest: {
    height: '48px',
    color: "#7F4998",
    backgroundColor: "#FFF",
    border: '1px solid #7F4998',
    borderRadius: '24px',
    boxShadow: 'none',
    fontSize: '16px',
  },
  buttomCash: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500',
    heigth: '48px',
    marginBottom: "20%",
    boxShadow: 'none',
    backgroundColor: '#B768D4',
    backgroundImage: 'linear-gradient(to right, #8F52AA , #B768D4)',
    borderRadius: '24px',
  }
});

class Home extends React.Component {
  state = {
    modals: {
      scan: false
    },
    sendScanArgs: null
  };

  scanQRCode = async data => {
    const { publicUrl } = this.props;
    // potential URLs to scan and their params
    const urls = {
      "/send?": ["recipient", "amount"],
      "/redeem?": ["secret", "amountToken", "amountWei"]
    };
    let args = {};
    let path = null;
    for (let [url, fields] of Object.entries(urls)) {
      const strArr = data.split(url);
      if (strArr.length === 1) {
        // incorrect entry
        continue;
      }

      if (strArr[0] !== publicUrl) {
        throw new Error("incorrect site");
      }

      // add the chosen url to the path scanned
      path = url + strArr[1];

      // get the args
      const params = strArr[1].split("&");
      fields.forEach((field, i) => {
        args[field] = params[i].split("=")[1];
      });
    }

    if (args === {}) {
      console.log("could not detect params");
    }

    await this.props.scanURL(path, args);
    this.props.history.push(path);
    this.setState({
      modals: { scan: false }
    });
  };

  render() {
    const { modals } = this.state;
    const { address, channelState, connextState, classes } = this.props;
    return (
      <>
        <AppBarComponent address={address}/>
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
        <Grid container direction="column">
          <Grid item xs={12}
            style={{ margin: '2% auto' }}
          >
            <Fab
              style={{
                color: "#FFF",
                backgroundColor: "#FFFFFF",
                width: '64px',
                height: '64px',
                border: '3px solid #B768D4',
                boxShadow: 'none',
              }}
              onClick={() =>
                this.setState({ modals: { ...modals, scan: true } })
              }
            >
              {/* <QRIcon /> */}
              <div
                style={{ marginTop: '15%' }}
              >
                <img
                  src={camQR}
                  alt=""
                  style={{ width: "24px", height: "24px" }}
                />
              </div>
            </Fab>
            <Modal
              id="qrscan"
              open={this.state.modals.scan}
              onClose={() =>
                this.setState({ modals: { ...modals, scan: false } })
              }
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
                handleResult={this.scanQRCode}
                history={this.props.history}
              />
            </Modal>
          </Grid>
        </Grid>
        <Grid
          container
          spacing={16}
          direction="column"
          style={{ paddingLeft: "2%", paddingRight: "2%", textAlign: "center" }}
        >
          <Grid item xs={12} style={{ paddingTop: "10%" }}>
            <Grid
              container
              spacing={8}
              direction="row"
              alignItems="center"
              justify="center"
            >
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  className={classes.buttonSendRequest}
                  variant="contained"
                  size="large"
                  component={Link}
                  to="/receive"
                >
                  <span
                    style={{ marginRight: '15%' }}
                  >
                    <img
                      src={arrowDown}
                      alt=""
                      style={{ width: "16px", height: "16px" }}
                    />
                  </span>
                  Request
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  className={classes.buttonSendRequest}
                  size="large"
                  variant="contained"
                  component={Link}
                  to="/send"
                >
                  <span
                    style={{ marginRight: '15%' }}
                  >
                    <img
                      src={arrowUp}
                      alt=""
                      style={{ width: "16px", height: "16px" }}
                    />
                  </span>
                  Send
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Button
              className={classes.buttomCash}
              fullWidth
              color="primary"
              variant="outlined"
              size="large"
              component={Link}
              to="/cashout"
            >
              Cash Out
            </Button>
          </Grid>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(Home);
