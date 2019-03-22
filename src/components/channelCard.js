import React, { Component } from "react";
import { Grid, Typography } from "@material-ui/core";
import { withStyles } from "@material-ui/core";
import { getChannelBalanceInUSD } from "../utils/currencyFormatting";

const styles = theme => ({
  row: {
    color: "white"
  },
  pending: {
    marginBottom: "3%",
    color: "white"
  },
  clipboard: {
    cursor: "pointer"
  }
});

class ChannelCard extends Component {
  render() {
    const { classes, channelState, connextState, marginBottom } = this.props;
    // only displays token value by default
    const display = getChannelBalanceInUSD(channelState, connextState)
    return (
        <Grid>
          <Grid
            container
            spacing={16}
            direction="row"
            style={{
              paddingLeft: "3%",
              paddingRight: "10%",
              paddingTop: "20%",
              paddingBottom: `${marginBottom}`,
              backgroundColor: '#B768D4',
              backgroundImage: 'linear-gradient(to right, #8F52AA , #B768D4)',
            }}
            alignItems="center"
            justify="center"
          >
          <Grid item xs={12}>
            <div style={{ fontSize: '16px', color: 'white', marginBottom: '20px' }}>
              Your Balance
            </div>
            <span>
              <Typography inline={true} variant="h2" className={classes.row}>
                <span>{display.substring(1, display.length - 2)}</span>
              </Typography>
              <Typography inline={true} variant="h2" className={classes.row}>
                <span style={{ marginRight: '15px' }}>{display.substr(display.length - 2)}</span>
              </Typography>
              <Typography inline={true} variant="h5" className={classes.row}>
                DAI
              </Typography>
            </span>
          </Grid>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(ChannelCard);
