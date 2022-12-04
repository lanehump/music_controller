import React, { Component } from "react";
import { Grid, Button, Typography, TextField, Card, CardContent, CardMedia, Box, IconButton, createTheme, ThemeProvider} from "@material-ui/core";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./MusicPlayer";



export default class Room extends Component {
  constructor(props) {
    super(props);
    this.state = {
      votesToSkip: 2,
      guestCanPause: false,
      isHost: false,
      showSettings: false,
      showSearchPage: false,
      spotifyAuthenticated: false,
      song: {},
      nextSong: "",
      searchResponse: [],
      songTitle: "",
    };
    this.roomCode = this.props.match.params.roomCode;
    this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
    this.updateShowSettings = this.updateShowSettings.bind(this);
    this.renderSettingsButton = this.renderSettingsButton.bind(this);
    this.renderSettings = this.renderSettings.bind(this);
    this.getRoomDetails = this.getRoomDetails.bind(this);
    this.authenticateSpotify = this.authenticateSpotify.bind(this);
    this.getCurrentSong = this.getCurrentSong.bind(this);
    this.addsongtoQueue = this.addsongtoQueue.bind(this);
    this.addsongtoQueue2 = this.addsongtoQueue2.bind(this);
    this.handleSong = this.handleSong.bind(this);
    this.renderSearchPage = this.renderSearchPage.bind(this);
    this.searchSong = this.searchSong.bind(this);
    this.handleSearchSong = this.handleSearchSong.bind(this);
    this.getRoomDetails();
  }
  componentDidMount() {
    this.interval = setInterval(this.getCurrentSong, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  getRoomDetails() {
    return fetch("/api/get-room" + "?code=" + this.roomCode)
      .then((response) => {
        if (!response.ok) {
          this.props.leaveRoomCallback();
          this.props.history.push("/");
        }
        return response.json();
      })
      .then((data) => {
        this.setState({
          votesToSkip: data.votes_to_skip,
          guestCanPause: data.guest_can_pause,
          isHost: data.is_host,
        });
        if (this.state.isHost) {
          this.authenticateSpotify();
        }
      });
  }

  authenticateSpotify() {
    fetch("/spotify/is-authenticated")
      .then((response) => response.json())
      .then((data) => {
        this.setState({ spotifyAuthenticated: data.status });
        console.log(data.status);
        if (!data.status) {
          fetch("/spotify/get-auth-url")
            .then((response) => response.json())
            .then((data) => {
              window.location.replace(data.url);
            });
        }
      });
  }
  addsongtoQueue() {
    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': "application/json"},
      body: JSON.stringify({
        nextSong: this.state.nextSong,
      }),
    }
    fetch('/spotify/add-to-queue', requestOptions)
    console.log(this.state.nextSong)
    console.log(requestOptions)
  }
  addsongtoQueue2(e) {
    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': "application/json"},
      body: JSON.stringify({
        nextSong: e,
      }),
    }
    fetch('/spotify/add-to-queue', requestOptions)
  }

  searchSong() {
    const requestOptions = {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        songTitle: this.state.songTitle
      })
    }
    fetch("/spotify/search-song", requestOptions).then((response) => response.json()).then((data) => this.setState({searchResponse: data}))
  }

  getCurrentSong() {
    fetch("/spotify/current-song")
      .then((response) => {
        if (!response.ok) {
          return {};
        } else {
          return response.json();
        }
      })
      .then((data) => {
        this.setState({ song: data });
      }).catch((error) => console.log("No song playing"))
  }

  leaveButtonPressed() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("/api/leave-room", requestOptions).then((_response) => {
      this.props.leaveRoomCallback();
      this.props.history.push("/");
    });
  }

  updateShowSettings(value) {
    this.setState({
      showSettings: value,
    });
  }
  handleSong(e) {
    this.setState({
      nextSong: e.target.value,
    })
  }
  handleSearchSong(e) {
    this.setState({
      songTitle: e.target.value,
    });
    this.searchSong()
    console.log(this.state.searchResponse)
  }

  renderSearchPage(){
    return(
        <Grid container spacing={1} style={{display: 'flex', flexDirection: 'column'}}>
          <MusicPlayer {...this.state.song} />
          <Grid item xs={12} align='center' display='none'>
            <TextField  align='center' placeholder="Search your song" position="sticky" onChange={this.handleSearchSong}></TextField>
            <Button variant="outlined" color="secondary" onClick={() => this.updateShowSearchPage(false)}>
            Back
            </Button>
          </Grid>
          <Grid container spacing={1} style={{ maxHeight: 400, overflow: 'auto', width: 800, alignItems: 'center', flexFlow: 'column'}}>
              {this.state.searchResponse.map(element =>
              <Grid item xs={{display: 'flex'}}>
              <Card style={{display: 'flex', direction: 'row', maxHeight: 100, width: 400, alignContent: 'stretch'}}>
                <Box sx={{ maxWidth: 64, maxheight: 64, justifyContent: 'stretch', flexDirection: 'row' }}>
                  <CardMedia component='img'  image={element.art}/>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', maxWidth: 340, maxheight: 64}}>
                    <CardContent sx={{ flex: '1 0 auto'}}>
                      <Typography component='div' variant='button' style={{fontSize: 12}}>
                        {element.song}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div" style={{fontSize: 12}}>
                        {element.artist}
                      </Typography>
                    </CardContent>
                  <IconButton variant="contained" fontSize={4} onClick={() => this.addsongtoQueue2(element.uri)}>+</IconButton>
                </Box>
              </Card>
              </Grid> )}
          </Grid>
        </Grid>
    );
  }

  renderSettings() {
    return (
      <Grid container spacing={1}>
        <Grid item xs={12} align="center">
          <CreateRoomPage
            update={true}
            votesToSkip={this.state.votesToSkip}
            guestCanPause={this.state.guestCanPause}
            roomCode={this.roomCode}
            updateCallback={this.getRoomDetails}
          />
        </Grid>
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => this.updateShowSettings(false)}
          >
            Close
          </Button>
        </Grid>
      </Grid>
    );
  }

  updateShowSearchPage(value) {
    this.setState({
      showSearchPage: value
    });
  }


  renderSettingsButton() {
    return (
      <Grid item xs={12} align="center">
        <Button
          variant="contained"
          color="primary"
          onClick={() => this.updateShowSettings(true)}
        >
          Settings
        </Button>
      </Grid>
    );
  }

  render() {
    if (this.state.showSettings) {
      return this.renderSettings();
    }
    if (this.state.showSearchPage){
      return this.renderSearchPage();
    }
    return (
      <Grid container spacing={1} style={{display: 'flex', flexDirection: 'column'}}>
        <Grid item xs={12} align="center">
          <Typography variant="h6" component="h6">
            Code: {this.roomCode}
          </Typography>
        </Grid>
        <MusicPlayer {...this.state.song} />
        <Grid item xs={12} align="center">
          <Button color="Primary" variant="contained" onClick={() => this.updateShowSearchPage(true)}>
            Search
          </Button>
        </Grid>
        {this.state.isHost ? this.renderSettingsButton() : null}
        <Grid item xs={12} align="center">
          <Button
            variant="contained"
            color="secondary"
            onClick={this.leaveButtonPressed}
          >
            Leave Room
          </Button>
        </Grid>
      </Grid>
    );
  }
}
