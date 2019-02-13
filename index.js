//SERVER CODE-----------------------------------------------------------------------------

//var FIO = require('./FIOserver_classes.js');
// var SimpleGameElement = require('./SimpleGameElement');
// var Resource = require('./Resource');
// var Player = require('./Player');
// var Resources = require('./Resources');

class SimpleGameElement{
	constructor(category,id,posn, imgsize){
		this.category = category; //EX: 'tree', 'oil', 'ore', 'player_building', etc
		this.posn = posn;
		this.x = posn[0];
		this.y = posn[1];
		this.imgsize = imgsize;

		//The size of the image on the canvas
		this.imgwidth = imgsize[0];
		this.imgheight = imgsize[1];

		//ID(key)
		this.id = id;
	}
}

class Resource extends SimpleGameElement{
	constructor(category, id, posn, imgsize, type){
		super(category,id,posn,imgsize);
		this.amount = Math.floor(Math.sqrt((imgsize[0]*imgsize[1]))); //how much wood the tree holds for the players to take
		this.type = type; //EX: catergory== 'tree' -> type == 'birch', or category =="mineral" -> type =="iron"
	}
}

class Tree extends Resource{
	constructor(category, id, posn, imgsize, type, tree_type){
		super(category, id, posn, imgsize, type);
		this.tree_type = tree_type;
	}
}

//Player
function Player(centralx, centraly, name,color, absx, absy){
	this.centralx = centralx;
	this.centraly = centraly;
	this.name = name;
	this.color = color;
	this.absx = absx;
	this.absy = absy;
	this.money = 100; //starts off with 100 money
	this.defense = 0;
	this.offense = 0;


	//HAND POSITION
	this.handx;
	this.handy;


	//Player Resources
	this.resources = new Resources();
}


function Resources(){
	this.logs = 0;
	this.rocks = 0;
	this.oil = 0;
	this.minerals = 0;
}

//ERROR: properties become 'undefined' after creating the object

// function DayNightCycle(daynight_cycle_time_minutes, ioObject){
// 		this.daynight_cycle_time_minutes = daynight_cycle_time_minutes; //the time it takes for it to become day->night, night->day in minutes
// 		this.current_time_milliseconds = 0;
// 		this.daynight_cycle_milliseconds = convertTimeToMilliseconds(0,daynight_cycle_time_minutes,0);
// 		this.one_percent = Math.floor(this.daynight_cycle_time_minutes*.01);
// 		this.day_night_percentage = Math.floor(this.current_time_milliseconds/this.daynight_cycle_milliseconds);
// 		this.BOOL_isDayTime = true;

// 		var self = this;
// 		this.Start_Cycle = 	function(ioObject){
// 			//console.log(self.current_time_milliseconds);
// 			setInterval(function(){
// 			//console.log('SETINTERVAL');
// 			//console.log(self.BOOL_isDayTime);
// 			self.day_night_percentage = Math.floor((self.current_time_milliseconds/self.daynight_cycle_milliseconds)*100);

// 			//if the current milliseconds counter is greater than the daynight cycle then set the
// 			//this.BOOL_isDayTime to false (to have it deincrement)
// 			if(self.current_time_milliseconds>=self.daynight_cycle_milliseconds){
// 				self.BOOL_isDayTime = false;
// 			}
// 			//if the current milliseconds counter reaches 0 then set this.BOOL_isDayTime to true (to have it increment)
// 			else if(self.current_time_milliseconds<=0){
// 				self.BOOL_isDayTime = true;
// 			}
// 			ioObject.sockets.emit('UpdateDayTime',{
// 				day_night_percentage: self.day_night_percentage

// 			})

// 			//then adding to the current time (0->100% to have the canvas filter go from light to dark)
// 			if(self.BOOL_isDayTime){
// 				//console.log("TRUE");
// 				self.current_time_milliseconds+=self.one_percent;
// 			}
// 			//(if this.BOOL_isDayTime==false)
// 			else{
// 				self.current_time_milliseconds-=self.one_percent;
// 			}
// 		}, self.one_percent);
// 	}
// }





function convertTimeToMilliseconds(hours, minutes, seconds){
	var hourstomilliseconds = hours*60*60*1000;
	var minutestomilliseconds = minutes*60*1000;
	var secondstomilliseconds = seconds*1000;

	var total_milliseconds = hourstomilliseconds+minutestomilliseconds+secondstomilliseconds;
	return total_milliseconds;
}

//------------------------------------------------------------------------
//Setting up the server
var express = require('express');
var app = express();
var socket = require('socket.io');
var port = 80;
//Socket Setup
var io = socket(server);


var server = app.listen(port, function(req,res){
	console.log(getRandomColor());
	console.log('server online');

});

//Static Files
app.use(express.static('public'));
app.get('/',function(req,res){
	res.sendFile(__dirname+'/public/gamebrowser.html');
	console.log('working server');
})




io.on('connection',function(socket){
	console.log('User '+socket.id+' has logged on.');

	//When the user presses 'Play'
	socket.on('playclick',function(data){
		console.log('User: '+data.name+' has entered the game.');
		addPlayer(socket.id,data); //adds player into game
		io.sockets.emit('playerconnected',{
			playername:data.name
		})
	})

	//Sends the dictionary of players to the clients
	socket.on('giveelements',function(){
		io.sockets.emit('getelements', {
			players: SERVER_PLAYERS,
			gameelements: SERVER_GAME_ELEMENTS,
			mapsize: MAP_SIZE
		});
	})


	//Updates the movement of the player who is pressing the arrow-keys/mouse+shift
	socket.on('movement',function(data){
		var player = SERVER_PLAYERS[socket.id];
		player.absx = player.absx+data.vx;
		player.absy = player.absy+data.vy;

		SERVER_PLAYERS[socket.id] = player;
	})

	//Sends to all the clients that a player message has been added to the game (so that each client can draw the message based
	//on their player location)
	socket.on('sendmessage', function(data){
		console.log(data.text);
		io.sockets.emit('receivedmessage', data);
		console.log('recievedmessage');
	})




	//Player disconnects and removes the player from the dictionary of players
	socket.on('disconnect',function(){
		//var player = list_of_players[socket.id]; //pulls the player's 'Player' object that disconnected

		console.log('User '+socket.id+' has logged off.');

		//Sends the Player's name back to all the clients so they can broadcast that he disconnected
		try{
			socket.broadcast.emit('playerdisconnected',{
				playername: SERVER_PLAYERS[socket.id].name
			});
		}
		catch(err){
			"";
		}
		console.log("sent playerdisconnected on serverside")

		//removes the player and their 'Player' object from the dictionary of players
		removePlayer(socket.id);


		console.log('NUMBER OF PLAYERS:'+ Object.keys(SERVER_PLAYERS).length);
		console.log(SERVER_PLAYERS);


	})
});

//Returns a random number from [0,number] +offset
function randomNum(number,offset){
	return Math.floor((Math.random()*number) +offset); //EX: number== 10, offset ==0, gets a number from 0-9 INCLUSIVE
}

//GAME ELEMENTS:-------------------------------------------------------------
var list_of_colors =["red","green","blue","purple","yellow"];
var SERVER_PLAYERS = {};
var number_of_gamelements = 250;
var MAP_SIZE = 2000;
var SERVER_GAME_ELEMENTS = {};



//DAY NIGHT CYCLE:
var daynight_cycle_time_minutes = 1; //CURRENTLY: 5 minutes (the time it takes for it to become day->night, night->day in minutes)
var current_time_milliseconds = 0;
var daynight_cycle_milliseconds = convertTimeToMilliseconds(0,daynight_cycle_time_minutes,0);
var one_percent = Math.floor(daynight_cycle_milliseconds*.01);
var day_night_percentage = Math.floor(current_time_milliseconds/daynight_cycle_milliseconds);
var BOOL_isDayTime = true; //controls if the counter should add onto the current_time_milliseconds or add (goes from DAY 0%->100% NIGHT then NIGHT100%->0% DAY )

Start_DayNightCycle();

function Start_DayNightCycle(){
			setInterval(function(){
			console.log(current_time_milliseconds);
			console.log("DAYTIME?:",BOOL_isDayTime);
			//console.log(one_percent);
			//console.log('SETINTERVAL');
			//console.log(self.BOOL_isDayTime);
			day_night_percentage = Math.floor((current_time_milliseconds/daynight_cycle_milliseconds)*100);

			//if the current milliseconds counter is greater than the daynight cycle then set the
			//this.BOOL_isDayTime to false (to have it deincrement)
			if(current_time_milliseconds>=daynight_cycle_milliseconds){
				BOOL_isDayTime = false;
			}
			//if the current milliseconds counter reaches 0 then set this.BOOL_isDayTime to true (to have it increment)
			else if(current_time_milliseconds<=0){
				BOOL_isDayTime = true;
			}
			io.sockets.emit('UpdateDayTime',{
				day_night_percentage: day_night_percentage

			})

			//then adding to the current time (0->100% to have the canvas filter go from light to dark)
			if(BOOL_isDayTime){
				//console.log("TRUE");
				current_time_milliseconds= current_time_milliseconds+ one_percent;
			}
			//(if this.BOOL_isDayTime==false)
			else{
				current_time_milliseconds-=one_percent;
			}
		}, one_percent);
}

addGameElements(number_of_gamelements, SERVER_GAME_ELEMENTS); //adds game elements to the dictionary of gameelements


//FUNCTIONS---------------------------------------------------
function removePlayer(key){
	delete SERVER_PLAYERS[key];
}


function getRandomColor(){
	var color = 'rgb('+ randomNum(255,0)+','+randomNum(255,0)+','+randomNum(255,0)+')';
	console.log(color);
	return color;
}

//Generates a random unique id (String)
//Using it for dictionary keys specific to a player/game element
function createRandomID(numberofcharacters, word){
	var id = "";
	for(var i=0;i<numberofcharacters;i++){
		var choice = randomNum(2,0);

		var random_string_index = randomNum(word.length,0);
		var randomletter = word.charAt(random_string_index); //pulls out a random character from the string

		switch(choice){
			case 0:
				id += randomletter;
			break;

			case 1:
				id+= randomNum(10,0); //returns a number from 0,1,2,3,4...9
			break;
		}
	}

	return id;
}



//ELEMENTS ARE ADDED BY CHANCE BASED 
//-> a random number is generated each for loop run and if the number is below the chance variable then it is added to the game
//-> takes in an integer and the dictionary of server elements
//and fills the dictionary with the Game Elements (only positions and simple data)
function addGameElements(numberofelements, serverelements){
	//the size of the sprite/images when within the game
	var imgsizex = 60; //px
	var imgsizey = 60;

	for(var i =0; i<numberofelements;i++){
		//Map ABSOLUTE location
		var randommapx = randomNum(MAP_SIZE,0); 
		var randommapy = randomNum(MAP_SIZE,0);

		console.log(randommapx,randommapy);

		//Resource chance (chance of the resource appearing)
		var oil_random = randomNum(100,0);
		var oil_chance = 5;
		var tree_random = randomNum(100,0);
		var tree_chance = 20;

		//RANDOM ID
		var id = createRandomID(10,"abcdefghijklmnopqrstuvwxyz");


		if(oil_random<oil_chance){
			console.log("ADDED 1 OIL GAMELEMENT");

			//Object being sent to client
			var oil = new Resource('resource',id, [randommapx,randommapy],[imgsizex,imgsizey],'oil');
			serverelements[id] = oil;
			
		}
		else if(tree_random<tree_chance){
			console.log("ADDED TREE");
			var tree_size = randomNum(50,40);

			var tree = new Tree('resource',id,[randommapx,randommapy],[tree_size,tree_size],'tree',randomNum(3,0));
			console.log(tree.tree_type);
			serverelements[id] = tree;
		}
		else if(createRandomChance(10,100)){
			console.log("ADDED ROCK");
			var rock = new Resource('resource',id,[randommapx,randommapy],[imgsizex,imgsizey],'rock');
			serverelements[id] = rock;
		}
	}
}

function createRandomChance(chance,number){
	var random = Math.floor((Math.random()*number) +0); //EX: number== 10, offset ==0, gets a number from 0-9 INCLUSIVE
	if(random<chance){
		return true;
	}
	else{
		return false;
	}
}	

function addPlayer(key, data){
	if (!(key in SERVER_PLAYERS)){
		var randomx = randomNum(MAP_SIZE,0);
		var randomy = randomNum(MAP_SIZE,0);
		var random_color = getRandomColor();
		console.log(getRandomColor());
		SERVER_PLAYERS[key] = new Player(data.centralx,data.centralx,data.name,random_color, randomx, randomy);
		console.log("ADDINGPLAYER ABS:",data.absx, data.absy);
	}
	else{
		console.log('Player already exists!');
	}
}

