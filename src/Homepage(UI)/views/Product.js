
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Typography from '../Component/Typography';
import Layout from './Layout';
import { Grid } from '@material-ui/core';
const { v4: uuidV4 } = require('uuid')

const backgroundImage =
'https://www.3playmedia.com/wp-content/uploads/blackboard-collaborate-blog-header.jpg';

const styles = (theme) => ({
  background: {
    backgroundImage: `url(${backgroundImage})`,
    backgroundColor: '#7fc7d9', // Average color of the background image.
    backgroundPosition: 'center',
  },
  button: {
    minWidth: 200,
  },
  h5: {
    marginBottom: theme.spacing(8),
    marginTop: theme.spacing(8),
    [theme.breakpoints.up('sm')]: {
      marginTop: theme.spacing(35),
    },
  },
  more: {
    marginTop: theme.spacing(2),
  },
});
async function videocall(){
  window.location.href = `/${uuidV4()}`

}
async function editor(){

  window.location.href='/editor'
}

function Product(props) {
  const { classes } = props;

  return (
    <Layout backgroundClassName={classes.background}>
      {/* Increase the network loading priority of the background image. */}
      <img style={{ display: 'none' }} src={backgroundImage} alt="increase priority" />
      <Typography color="inherit" align="center" variant="h2" marked="center">
        RENDEZVOUS
      </Typography>
      <Typography color="inherit" align="center" variant="h5" className={classes.h5}>
          Start Collaborating OR Scroll down to know more.
      </Typography>
      <Grid container spacing={2} justify="center">
                <Grid item>
                  <Button variant="contained" color="secondary" className={classes.button} onClick={videocall}>
                    Start a Video Call
                  </Button>
                </Grid>
                <Grid item>
                  <Button variant="contained" color="secondary" className={classes.button} onClick={editor}>
                    Start an Online Editor
                  </Button>
                </Grid>
                </Grid>
      
    </Layout>
  );
}

Product.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Product);