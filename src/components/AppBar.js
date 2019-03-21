import React, { Component } from "react";
import {
  AppBar,
  Toolbar,
  withStyles,
  Grid,
} from "@material-ui/core";
import SettingIcon from "@material-ui/icons/Settings";
import { Link } from "react-router-dom";

const logo = require("../assets/logo.png");

const styles = theme => ({
  bar: {
    paddingTop: "2%",
    backgroundColor: '#B768D4',
    backgroundImage: 'linear-gradient(to right, #8F52AA , #B768D4)',
  },
  logo: {
    color: '#ffffff',
    display: 'flex',
  },
  settings: {
    height: "16px",
    display: 'flex',
    justifyContent: 'flex-end',
  }
});
class AppBarComponent extends Component {
  render() {
    const { classes } = this.props;
    return (
      <Grid>
        <Grid container spacing={16}>
          <AppBar position="sticky" color="secondary" elevation={0} className={classes.bar}>
            <Toolbar>
              <Grid
                container
                spacing={16}
                direction="row"
                justify="space-between"
                alignItems="center"
                style={{ textAlign: "center" }}
              >
                <Grid item xs={3}>
                  <Link
                    style={{
                      textDecoration: 'none',
                    }}
                    to="/deposit"
                  >
                    <div className={classes.logo}>
                      <div>
                        <img
                          src={logo}
                          alt=""
                          style={{ width: "25.48px", height: "24px", marginTop: '2px' }}
                        />
                      </div>
                      <div style={{ marginLeft: '5px', lineHeight: "28px" }}>
                        mosendo
                      </div>
                    </div>
                  </Link>
                </Grid>
                <Grid item xs={5}>
                  <Link
                    style={{
                      color: "#ffffff",
                      fontSize: "13px",
                      textDecoration: 'none',
                    }}
                    to="/settings"
                  >
                    <div className={classes.settings}>
                      <div>
                        <SettingIcon style={{ width: '20.04px', height: '21px', marginTop: '-3px' }} />
                      </div>
                      <div style={{ marginLeft: "3px", lineHeight: '16px' }}>
                        &nbsp;Settings
                      </div>
                    </div>
                  </Link>
                </Grid>
              </Grid>
            </Toolbar>
          </AppBar>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(AppBarComponent);
