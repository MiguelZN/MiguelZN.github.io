//CLIENT CODE
var socket = io.connect('https://miguelzn.github.io');
socket.on('connect',function(){
	SOCKET_ID = socket.io.engine.id; //gives the variable 'SOCKET_ID' to the client, the socket 
									//connection unique id (to idenify client-speciifc player)
});

//HTML ELEMENTS
var playbutton = document.getElementById('playbutton');
var canvas = document.getElementById('canvas');
var userloginbox = document.getElementById('userlogincontainer');
var usernameinput = document.getElementById('usernameinput');
var titlelogocontainer = document.getElementById('titlelogocontainer');
var titlelogo = document.getElementById('titlelogo');
var usertitle = document.getElementById('usertitle');
var backgroundvideo = document.getElementById('backgroundvid');
var numberofplayersdisplay = document.getElementById('numberofplayers');
var scoreandchatcontainer = document.getElementById('scoreandchatcontainer');
var chat = document.getElementById('chat');

//SERVER,CLIENT ELEMENTS
var SERVER_GAME_ELEMENTS = {};
var SERVER_PLAYERS = {};
var CLIENT_GAME_ELEMENTS = {};
var CLIENT_SPRITES_IMAGES = {};


//CLIENT GAME ELEMENTS
var isPlaying = false;
var ctx = canvas.getContext('2d');
var list_of_colors =["red","green","blue","purple","yellow"];
var PLAYER_X,PLAYER_Y,PLAYER_NAME,PLAYER_COLOR,SOCKET_ID,PLAYER_MESSAGE,BOOL_DisplayPlayerMessage;
const FPS = 60; //frames per second
var PLAYER_MESSAGES = {}; //messages that are said by players (currently each message is deleted 2-3 seconds afterwards)
var number_of_players = 0; //A count of the number of players playing within the server

//Adjusting the Canvas Size
var new_canvas_size = adjustCanvas(window,.5,.6);
canvas.width = new_canvas_size[0];
canvas.height = new_canvas_size[1];
var HALFCANVASX = Math.floor(canvas.width/2); //Central x,y positions of the canvas
var HALFCANVASY = Math.floor(canvas.height/2);

//Mouse Variables:
var MOUSEX, MOUSEY; //(these are updated through a 'mousemove' event listener)

//MAP
var MAP_SIZE = 0; //The map_size is updated by the server (given the actual mapsize value)

//DayNightCycle
var DAY_NIGHT_PERCENTAGE = 0; //0 means daytime, 100 means nighttime

//IMAGES:
var croppedimage = new Image();
croppedimage.src = "asianelephant.png";
ctx.imageSmoothingEnabled = false;

var chatbox = new Image();
chatbox.src = 'chatbox.png';

//SOUNDS
var CHOP_SOUND = new Audio('chop.mp3');

//------------------------

//Adjusts the canvas window for each device size
function adjustCanvas(windowhtml, widthprop, heightprop){
	var newwidth = Math.floor(windowhtml.screen.width *widthprop);
	var newheight = Math.floor(windowhtml.screen.height *heightprop);

	return [newwidth,newheight];
}

//EVENT LISTERNERS-------------------------------------------
function convertTimeToMilliseconds(hours, minutes, seconds){
	var hourstomilliseconds = hours*60*60*1000;
	var minutestomilliseconds = minutes*60*1000;
	var secondstomilliseconds = seconds*1000;

	var total_milliseconds = hourstomilliseconds+minutestomilliseconds+secondstomilliseconds;
	return total_milliseconds;
}

//CLICK EVENT
canvas.addEventListener('click',function(event){
	//Finding the position of the mouse on the
	var rect = canvas.getBoundingClientRect();
	var clickx = Math.floor(event.clientX - rect.left);
	var clicky = Math.floor(event.clientY - rect.top);
	console.log(CLIENT_GAME_ELEMENTS);

	//(NOT A GAME ELEMENT OBJECT)
	//returns an object that contains .closestkey and .closestdistance properties
	var findclosestGM = findClosestGameElement([clickx,clicky],CLIENT_GAME_ELEMENTS, HALFCANVASX,HALFCANVASY)

	//Looks for the closest element to the mouse position
	var closest_KEY = findclosestGM.closestkey;
	var closest_distance =findclosestGM.closestdistance;

	//Determining the radius of the game element (finding their sprite OR gameelement (both have the image sizex, y) and calculating the radius)
	var closest_gameElement = CLIENT_GAME_ELEMENTS[closest_KEY];
	var relativetuple = findRelativePosn(PLAYER_X,PLAYER_Y,closest_gameElement.x,closest_gameElement.y,HALFCANVASX,HALFCANVASY);

	//Returns either true or false if the player clicked on the nearest Game Element
	isWithinObject([clickx,clicky],relativetuple,closest_gameElement.imgsize[0],closest_gameElement.imgsize[1]);
	console.log("CLOSEST GAME ELEMENT:",closest_gameElement);

	// var actualposn = convertPosnToActualCoordinate([HALFCANVASX,HALFCANVASY],[MOUSEX,MOUSEY],canvas.height);


	console.log(convertTimeToMilliseconds(0,5,0));
	// console.log("DEGREES:",determineRadiansDegrees(actualposn,"degrees"));
});


var MPOSN1, MPOSN2;
var MOUSE_TIMER = null;

//CURRENTLY AM TRYING TO FIX THE PLAYER'S HAND AND FIGURE OUT WHY IT IS NOT GOING TO THE RIGHT ANGLE
//Finds the mouse posn within the canvas and updates the 'MOUSEX' and 'MOUSEY' variables
canvas.addEventListener('mousemove',function(event){
	var rect = canvas.getBoundingClientRect();
	var x = Math.floor(event.clientX - rect.left);
	var y = Math.floor(event.clientY - rect.top);

	//Assigning the Global 'MOUSEX' and 'MOUSEY' variables to the mouse's position
	MOUSEX = x; 
	MOUSEY = y;

	var actualposn = convertPosnToActualCoordinate([HALFCANVASX,HALFCANVASY],[MOUSEX,MOUSEY]);
	var radians = determineRadiansDegrees(actualposn,"radians");

	// console.log("BEFOREHANDX,Y: ACTUAL:", actualposn);
	// console.log("COS:",Math.cos(radians));
	// console.log("SIN:",Math.sin(radians));
	var client_player = SERVER_PLAYERS[SOCKET_ID];
	client_player.handx = 40 * (Math.cos(radians));
	client_player.handy = 40 * (Math.sin(radians));

	var handcanvasposn = convertActualCoordinateToCanvasPosn([SERVER_PLAYERS[SOCKET_ID].handx,SERVER_PLAYERS[SOCKET_ID].handy],HALFCANVASX,HALFCANVASY);
	drawCircle(handcanvasposn[0],handcanvasposn[1],12,SERVER_PLAYERS[SOCKET_ID].color);
	// console.log("MOUSEPOSN",MOUSEX,MOUSEY);
	// console.log("HALFCANVAS:",HALFCANVASX,HALFCANVASY);
	// console.log("DEGREES:",degrees);
})


//Stops the setInterval function within mousedown when the player releases the mouseclick
document.addEventListener('mouseup',function(event){
	clearInterval(MOUSE_TIMER);
})

//Plays a chop sound if the mouse button is held down and is moving the mouse quickly
canvas.addEventListener('mousedown',function(event){
	if(MOUSE_TIMER){
		clearInterval("MOUSETIMER:",MOUSE_TIMER);
	}

	console.log(MOUSE_TIMER);

	var trackspeed = 200; //milliseconds
	MOUSE_TIMER = setInterval(function(){
		MPOSN1 = [MOUSEX,MOUSEY];

		if(MPOSN2==undefined){
			MPOSN2 = MPOSN1;
		}

		setTimeout(function(){
			console.log(MPOSN1,MPOSN2);
			var speed = calculateSpeed(MPOSN1,MPOSN2,trackspeed)
			console.log(speed);

			if(speed>0.15){
				CHOP_SOUND.play();
			}
			else{
				console.log("NOT FAST ENOUGH");
			}


			MPOSN2 = MPOSN1; //at the end of the mouse function
		},trackspeed);
	},trackspeed);

})

function calculateSpeed(posn1,posn2,time){
	var distance = calculateDistance(posn1,posn2);
	console.log(distance);
	var speed = distance/time;
	return speed;
}

playbutton.addEventListener('click',playGame);
function playGame(){

	//etc
	adjustTitleImage(); //Displays the canvas, makes the FeintIO logo smaller, makes the userlogin box disappear
	isPlaying = true; //tells the javascript code that the game is underway
	PLAYER_Y = 0;
	PLAYER_X = 0;

	//console.log(PLAYER_Y,PLAYER_X);

	//Pulls out the user inputted name and places it in the HTML tag
	PLAYER_NAME = usernameinput.value;

	//PLAYER_COLOR = //list_of_colors[randomNum(list_of_colors.length,0)];
	usertitle.innerHTML = PLAYER_NAME ;
	socket.emit('playclick', {
		centralx: HALFCANVASX,
		centraly: HALFCANVASY,
		name: PLAYER_NAME,  //pulls out the user's name that they inputted
	});

	scoreandchatcontainer.style.display = 'inline-block';

}


//->Takes in an origin position (in this case the halfcanvasx, halfcanvasy) (the middle of the canvas is the origin)
//-> Takes in a position (in this case the mouse position)
//-> And lastly takes in the canvas window's height 
//Returns the position if it were on a math graph (to find the angle of the mouse position)
function convertPosnToActualCoordinate(originposn, posn){
	var originx = originposn[0];
	var originy = originposn[1];
	var x = posn[0];
	var y = posn[1];

	var ActualCordx = x-originx;
	var ActualCordy = originy-y;
	// console.log("ACTUALCOORDINATE:",ActualCordx,ActualCordy);
	// console.log("ONTHECANVAS:", ActualCordx+HALFCANVASX,HALFCANVASY-ActualCordy);

	return [ActualCordx,ActualCordy];
}

//->Takes in an origin position (in this case the halfcanvasx, halfcanvasy) (the middle of the canvas is the origin)
//-> Takes in a position (in this case the mouse position)
//-> And lastly takes in the canvas window's height 
//Returns the position if it were on a math graph (to find the angle of the mouse position)
function convertActualCoordinateToCanvasPosn(Actualposn, halfcanvaswidth, halfcanvasheight){
	var x = Actualposn[0];
	var y = Actualposn[1];

	// console.log("ACTUALPOSN:",x,y);

	var canvasposnx = x+halfcanvaswidth;
	var canvasposny = halfcanvasheight-y;


	// console.log("CANVASPOSN:",canvasposnx,canvasposny);
	/*
	console.log("CANVASWIDTH:",canvas.width);
	console.log("CANVASHEIGHT:",canvas.height);*/

	return [canvasposnx,canvasposny];
}


//Returns the angle degree or radian of the given position 
//(assumes that the position is on a (0,0) origin so for example: (250,250) would be a
//radian/degree angle in the first quadrant)
function determineRadiansDegrees(posn,angleordegree){
	var quadrant;
	var angle;
	var radians;
	var x = posn[0];
	var y = posn[1];

	if(x>=0 && y>=0){
		quadrant = 1;
	}
	else if(x<=0 &&y>=0){
		quadrant = 2;
	}
	else if(x<=0 && y<=0){
		quadrant = 3;
	}
	else{
		quadrant = 4;
	}

	//console.log("(X,Y):", x,y);

	//Finds the radians and degrees of the first quadrant
	radians = Math.atan(Math.abs(y)/Math.abs(x)); //TOA  (opposite/adjacent)
	degrees = radians*180/Math.PI;

	switch(quadrant){
		case 1:
		radians = radians;
		degrees = degrees;
		break;

		case 2:
		degrees = 180-degrees;
		break;

		case 3:
		degrees = 180+degrees;
		break;

		case 4:
		degrees = 360-degrees;
		break;
	}

	// console.log("QUADRANT:",quadrant);
	// console.log("REFERENCEANGLE:",reference_angle);
	// console.log("AFTERSWITCHQUAD:",degrees);

	radians = (degrees*Math.PI)/180;

	switch(angleordegree){
		case "degrees":
		return degrees;
		break;

		default:
		return radians;
		break;
	}







}



//WORKS
//finds the closest game element to the inputted position 
//->Returns the key (UNIQUE ID) of the game_element for easy lookup in the dictionary of sprites/gamelements
function findClosestGameElement(posn, listofgamelements, halfcanvas_x, halfcanvas_y){
	var closest_KEY; //stores the key of the closest game_element(the unique id)
	var closest_distance; //keeps track of the closest distance to inputted position
	console.log("ENTERED");

	//Checks if there is atleast one 'GameElement' Object
	if(Object.keys(listofgamelements).length>0){
		//Starts with the first element
		closest_KEY = Object.keys(listofgamelements)[0];
		var first_GAME_ELEMENT = listofgamelements[closest_KEY];
		var relativetuple = findRelativePosn(PLAYER_X,PLAYER_Y,first_GAME_ELEMENT.x,first_GAME_ELEMENT.y,halfcanvas_x,halfcanvas_y);
		var x = relativetuple[0];
		var y = relativetuple[1];
		closest_distance = calculateDistance(posn,[x,y]);
	}
	else{
		console.log("THERE IS NO GAME ELEMENTS");
		return;
	}
	//console.log("WORKS");

	//Checks all of the GameElements and finds the closest to the inputted position
	for(var key in listofgamelements){
		console.log(key);
		var current_gameElement = listofgamelements[key];
		console.log(current_gameElement);
		var relativetuple = findRelativePosn(PLAYER_X,PLAYER_Y,current_gameElement.x,current_gameElement.y,halfcanvas_x,halfcanvas_y);
		var x = relativetuple[0];
		var y = relativetuple[1];
		//console.log(x,y);
		//console.log(posn[0],posn[1]);
		var current_distance = calculateDistance(posn,[x,y]);

		console.log(current_distance);

		if(current_distance<closest_distance){
			console.log("FOUND A CLOSER GAME ELEMENT");
			closest_distance = current_distance;
			closest_KEY = key;
		}
	}
	console.log(closest_KEY);
	console.log(closest_distance);
	console.log(listofgamelements[closest_KEY].x,listofgamelements[closest_KEY].y);

	return {
		closestkey: closest_KEY,
		closestdistance: closest_distance}; 
}

function calculateImageRadius(posn, imgsizex, imgsizey){
	var x = posn[0];
	var y = posn[1];

	var radius = Math.sqrt(Math.pow(imgsizex,2)+Math.pow(imgsizey,2));
	console.log(radius);
	return radius;
}

function isWithinObject(mouseposn,posn, imgsizex, imgsizey){
	var MOUSEX = mouseposn[0];
	var MOUSEY = mouseposn[1];
	var x = posn[0];
	var y = posn[1];

	var leftmost = x-(imgsizex/2);
	var rightmost = x+(imgsizex/2);
	var topmost = y-(imgsizey/2);
	var bottommost = y+(imgsizey/2);

	console.log(mouseposn,posn,leftmost,rightmost,topmost,bottommost);

	if((leftmost<MOUSEX)&&(MOUSEX<rightmost)&&(topmost<MOUSEY)&&(MOUSEY<bottommost)){
		console.log("CLICKED ON GAME ELEMENT");
		return true;
	}
	else{
		console.log("DID NOT CLICK ON GAME ELEMENT");
		return false;
	}
}

//Helper Functions---------------------
function calculateDistance(posn1,posn2){
	var x1 = posn1[0];
	var y1 = posn1[1];
	var x2 = posn2[0];
	var y2 = posn2[1];
	var distance = Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2));
	return distance;
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

	return id; //(string)
}

//Draws a circle onto the canvas
function drawCircle(x,y,radius, color){
	ctx.beginPath();
	ctx.arc(x,y,radius,0,2*Math.PI);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.fillStyle = "black";
	ctx.stroke();
	ctx.fillStyle = color;
}

//Returns a random number from [0,number] +offset
function randomNum(number,offset){
	return Math.floor((Math.random()*number) +offset); //EX: number== 10, offset ==0, gets a number from 0-9 INCLUSIVE
}

//Adjusts the title image (makes it smaller and centers it on top of the canvas)
function adjustTitleImage(){
	userloginbox.style.display = 'none';
	titlelogo.style.height = '10%';
	titlelogo.style.width = '20%';
	titlelogocontainer.style.textalign = 'left';
	titlelogo.style.margin = '5px';
	//titlelogo.style.display = 'none';
	backgroundvideo.style.display ='none';
	backgroundvideo.pause();
	canvas.style.display = 'inline-block';
}

function updateChatScrollBar(chathtmlelement){
	chathtmlelement.scrollTop = chathtmlelement.scrollHeight;
}

function updateNumberOfPlayersDisplay(numberofplayers){
	//console.log(numberofplayers);
	if(isPlaying){
		numberofplayersdisplay.innerHTML = 'Number of Players:' + numberofplayers;
	}
}

//ALLOWS THE USER TO TYPE A MESSAGE USING 'T' KEY (sends the inputted message to the server which then sends it back
//to all the clients in order to draw them)
document.addEventListener('keydown', function(event){
	if(event.key=="t" && isPlaying==true){
		PLAYER_MESSAGE = prompt('Type Message:');
		BOOL_DisplayPlayerMessage = true;
		var clientPLAYER_COLOR = SERVER_PLAYERS[SOCKET_ID].color; //pulls out the client's player's color

		socket.emit('sendmessage', {
			x: PLAYER_X+40,
			y: PLAYER_Y-30,
			text: PLAYER_MESSAGE,
			isdisplayed: BOOL_DisplayPlayerMessage,
			owner: SOCKET_ID,
			player_name: PLAYER_NAME,
			player_color: clientPLAYER_COLOR
		})
	}
	

})


//Code from stackoverflow (not mine, all other code is mine)
String.prototype.InsertAt=function(CharToInsert,Position){
     return this.slice(0,Position) + CharToInsert + this.slice(Position)
}

//Adds a 'Message' Object to the dictionary of messages
//when a player types 'T' and types a message (currently gets 
//added to the dictionary of messages and is deleted a few seconds later)
function addMessage(x,y,text,isdisplayed,owner, chathtmlelement, player_name, player_color){
	var message = new Message(x,y, text, isdisplayed, owner);
	var random_id = randomNum(50000,0);
	var date = new Date();

	PLAYER_MESSAGES[random_id] = message;

	if(player_name==""){
		player_name = "<blank>";
	}

	//Adding the chat message to the chat box:
	//EX:cell4.innerHTML = "<span style='font-size:40px'>John Doe</span>";
	chathtmlelement.innerHTML+= "<div style = 'color:#ffc338;margin-left:5px;display:inline-block'><b>"+"["+date.toUTCString()+"]"+"<div style = "+'color:'+player_color+';padding-top:0px;padding-bottom:5px;display:inline-block>'+player_name+":"+ "<span style = 'color:#ffffff'>"+text+"</span></div></b></div>";

	//deletes the chatbubble after a few seconds
	setTimeout(function(){
		delete PLAYER_MESSAGES[random_id];
	},3000);
}

//Takes all of the 'Message' Objects that were returned by the server and placed into the list of messages 
//and draws them onto the canvas per client
function drawMessages(){
	var font_size = 15;
	ctx.font = ''+font_size+'px Arial';
	ctx.fillStyle = 'black';

	//var i=0;i<PLAYER_MESSAGES.length;i++
	for(var i in PLAYER_MESSAGES){
		var message = PLAYER_MESSAGES[i].text;
		//NOTE: DRAW IN TERMS OF THE USER'S POSN NOT THE ONE WHO SENT IT, THE ONE WHO SENT MESSAGE SHOULD ONLY BE SENDING THEIR LOCATION
		//THEN YOU DEAL WITH DRAWING IT IN TERMS OF THIS CURRENT PLAYER'S POSITION
		var relativetuple = findRelativePosn(PLAYER_X,PLAYER_Y, PLAYER_MESSAGES[i].x,PLAYER_MESSAGES[i].y,HALFCANVASX,HALFCANVASY);
		//'findRelativePosn' takes the Absolute positions on the map and converts them into a canvas relative position (one that
		//can be drawn onto the canvas based on the client's position)
		var x = relativetuple[0];
		var y = relativetuple[1];
		console.log(message);

		// var most_chars_per_line = 5;
		// var number_of_chars = message.length;

		// var scaley = 25;
		// var number_of_new_lines;
		// var addedheightchatbox;

		// if(number_of_chars>most_chars_per_line){
		// 	number_of_new_lines = Math.floor(number_of_chars/most_chars_per_line);
		// 	addedheight = number_of_new_lines*scaley;

		// 	for(var i=1;i<=number_of_new_lines;i++){
		// 		var current_char = i*most_chars_per_line; //pulls out the current character location (INDEX)
		// 		message.InsertAt('\\n',current_char);

		// 	}
		// }
		// else{
		// 	addedheight = scaley;
		// }

		// var messagelength = ctx.measureText(message).width;
		// //ctx.drawImage(chatbox, x-(messagelength/2),y-(messagelength/2),messagelength*2, messagelength);
		// ctx.drawImage(chatbox, x-(messagelength/2),y-font_size,messagelength*2, addedheight);
		// ctx.fillText(message, x,y+(addedheight/3));
		// ctx.fillText("thanks\nso\nmuch", HALFCANVASX,HALFCANVASY);

		//Good enough (messed around with values)
		var messagelength = ctx.measureText(message).width;
		ctx.drawImage(chatbox, x-(messagelength/2),y-font_size,messagelength*2, font_size+25);
		ctx.fillText(message, x,y+10);
	}
}

//Retrieves information about every player from server then draws each player onto the canvas based on their ABSOLUTE POSITION NEAR THE CLIENT PLAYER
function drawPlayers(listofplayers){
	for(var key in listofplayers){
		var player = listofplayers[key];
		//PLAYER_X is THE CLIENT's player ABSOLUTE position x
		//PLAYER_Y is THE CLIENT's player ABSOLUTE position y
		var relativetuple = findRelativePosn(PLAYER_X,PLAYER_Y, player.absx,player.absy,HALFCANVASX,HALFCANVASY);
		ctx.font = '15px Arial';
		//ctx.strokeStyle = 'black';



		//if it is the user's player (DRAWING IN TERMS OF THIS CLIENT'S USER)
		if(key==SOCKET_ID){
			drawCircle(HALFCANVASX,HALFCANVASY,30,player.color);
			ctx.fillText(player.name,HALFCANVASX-30,HALFCANVASY-45);
			
		}
		//DRAWING IN TERMS OF ANOTHER USER
		else{
			drawCircle(relativetuple[0],relativetuple[1],30,player.color);
			ctx.fillText(player.name, relativetuple[0]-30,relativetuple[1]-45);

			// var handcanvasposn = convertActualCoordinateToCanvasPosn([SERVER_PLAYERS[key].handx,SERVER_PLAYERS[key].handy],HALFCANVASX,HALFCANVASY);
			// drawCircle(handcanvasposn[0],handcanvasposn[1],12,SERVER_PLAYERS[key].color);
			
		}
	}
}

//GAME SPRITES AND GAME ELEMENTS:
//-> a gameelement is the phyiscal code/data of an ingame rock, tree, etc (holds the data for its position, etc)
//-> a gamesprite is the image version of the ingame rock,tree etc (the animation/image of the game element)
function addImagesAndSprites(ServerGameElements){
	for(var key in ServerGameElements){
		//console.log("INSIDE ADDIMAGESSPRITES");
		var server_game_element = ServerGameElements[key]; //pulls out the 'GameElement' Object

		//Compares the keys between the serverGameElements and clientGameElements
		//-> if it exists in server but not client then it creates a clientGameElement
		if((key in CLIENT_GAME_ELEMENTS==false) && (key in CLIENT_SPRITES_IMAGES==false)){
			//console.log("IN FIRST IF");
			var new_game_element;
			//var id = server_game_element.id;
			var posn = server_game_element.posn;
			var imgsize = server_game_element.imgsize;
			var category = server_game_element.category;

			switch(category){
				case 'resource':
					var type = server_game_element.type;
					switch(type){
						case 'oil':
						new_game_element = new Resource('resource',key,posn,imgsize,'oil');
						break;

						case 'tree':
						new_game_element = new Tree('resource',key,posn,imgsize,'tree', server_game_element.tree_type);
						break;

						case 'rock':
						new_game_element = new Resource('resource',key,posn,imgsize,'rock');
						break;
					}
				break;

				default:
				console.log("THIS CATEGORY DOES NOT EXIST");
				break;
			}
			//adds the new game element to the client dictionary of elements
			CLIENT_GAME_ELEMENTS[key] = new_game_element;


			//ADDING TO DICTIONARY OF SPRITES/IMAGES
			var new_game_spriteimage; 
			switch(category){
				case 'resource':
					var type = server_game_element.type;
					switch(type){
						case 'oil':
						new_game_spriteimage = new Sprite(ctx,'oil.png',0,0,16,16,300,100,imgsize[0],imgsize[1],0,6,60,4);
						break;

						case 'tree':
						new_game_spriteimage = new Imagesheet(ctx, 'trees.png',16,16, imgsize[0],imgsize[1]);
						break;

						case 'rock':
						new_game_spriteimage = new Imagesheet(ctx, 'rocks.png',16,16, imgsize[0],imgsize[1]);
						break;

					}
				break;

				default:
				console.log("THIS CATEGORY DOES NOT EXIST");
				break;
			}
			CLIENT_SPRITES_IMAGES[key] = new_game_spriteimage;
		}
	else if(key in CLIENT_SPRITES_IMAGES && key in CLIENT_GAME_ELEMENTS){
		//console.log("FOUND KEY IN SPRITES")
		var game_element = CLIENT_GAME_ELEMENTS[key];
		var game_elementsprite = CLIENT_SPRITES_IMAGES[key]; //the phyiscal sprite image (to draw the sprite onto the canvas)
		//console.log(game_element);
		var relativetuple = findRelativePosn(PLAYER_X,PLAYER_Y, game_element.posn[0],game_element.posn[1],HALFCANVASX,HALFCANVASY);
		// game_elementsprite.imgsizex = game_element.imgsizex;
		// game_elementsprite.imgsizey = game_element.imgsizey;


		switch(game_elementsprite.sheet){
			case "imagesheet":
				switch(game_element.type){
					case 'tree':
					//console.log("ENTERED TREE TYPE");
					game_element.grow();
					game_elementsprite.drawimage(relativetuple[0],relativetuple[1],0,game_element.tree_type, game_element.imgsize[0],game_element.imgsize[1]);
					break;

					case 'rock':
					game_elementsprite.drawimage(relativetuple[0],relativetuple[1],0,0,game_element.imgsize[0],game_element.imgsize[1]);
					break;

					default:
					console.log("ERROR AT DRAWING IMAGESHEET");
					break;
				}

				//drawCircle(relativetuple[0],relativetuple[1],2,"red");
				break;
			case "spritesheet":
				//console.log("SPRITESHEET");
				game_elementsprite.drawimage(relativetuple[0],relativetuple[1]);
				game_elementsprite.update();
				//drawCircle(relativetuple[0],relativetuple[1],2,"red");
				break;

			default:
			break;

		}
	}
	else{
		console.log("ELSE");
	}
	}

}


//Takes in a player x,y and every other element in the game such as spites, trees, etc 
//and converts their absolute positions within the game map into a relative canvas position 
//(a position that can be drawn onto the canvas)

//This way when the client player moves left, their absolute positon gets moved left and the 
//game renders everything near the player
function findRelativePosn(p_absposnx, p_absposny, other_absposnx, other_absposny, half_canvasx, half_canvasy){
	var relativex, relativey, canvasleftx, canvastopx;  //canvastopx means the first two quadrants [0,halfcanvasheight]

	/*EXPLANATION
	1) find half canvasx, half canvas y EX: lets say the center of our canvas is at (250,250) so HALFCANVASX and y == 250
	2) take the ABS x, ABS y of CLIENT player and sub the half canvas x, and the half of canvas y to get the top left ABSOLUTE POSN
	corner of the CLIENT's canvas 
	EX: My player's abs x,y are at (1000,1000), the HALFCANVASX,y are 250,250 (250,250 is the center of the canvas screen)
	Thus the top left of the canvas screen in terms of ABSOLUTE coordinates is 1000-250 = 750x, 1000-250= 750y == (750,750)

	3) Take that x, y and sub the other players' absx,y posn to convert another player's ABS posn to a relative canvas x,y position
	EX: lets say a player is at 1100, 1000 and our player is at 1000,10000 (we should be able to see him)
	(we cannot flat out place 1100,1000 on the canvas window because it would be out of view and it would
	not make sense since our player is at 1000,1000 our player is at the center of the screen)

	We take the top left coordinate of our canvas ABSOLUTE coordinate == (750,750)
	and subtract the other player's coordinates by it
	Thus: 1100-750 = 350x  , 1000-750 = 250y  == the player on our client's canvas window would be drawn
	at (350,250) and that makes sense because our player is only 100 left to that player
	
	canvasleftx = below
	canvastopy = below
	__________________________
	|x,y
	|
	|
	|
	|
	|
	|


	*/
	//console.log('HALFCANVASX:'+half_canvasx);
	//console.log('HALFCANVASY:'+half_canvasy);

	//The 0,0 position of the ABS player position
	canvasleftx = p_absposnx-half_canvasx;
	canvastopx = p_absposny - half_canvasy;

	//console.log('TOPLEFT:('+ canvasleftx+','+canvastopx+')');


	relativex = other_absposnx- canvasleftx;
	relativey = other_absposny - canvastopx; 

	//console.log('('+relativex+','+relativey+')');
	return [relativex,relativey];
}


function drawABSLocation(){
	var coordinate = 'CORD:' + '('+PLAYER_X+','+PLAYER_Y+')';
	ctx.font = '15px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(coordinate,5,20);  //places the text at (5,20)
}

//Refreshes the Canvas
function clearCanvas(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}


//EXAMPLE KEYEVENT (prints the key onto the usertitle section)
//DEPRECIATED
// document.onkeypress = function(e){
// 	var keynum;
//     if(window.event) { // IE                    
//       keynum = e.keyCode;
//     } else if(e.which){ // Netscape/Firefox/Opera                   
//       keynum = e.which;
//     }

//     usertitle.innerHTML = (String.fromCharCode(keynum));}


//OTHER METHOD (NEWER)
// document.addEventListener('keydown', function(event){
// 	var key = event.key;
// 	usertitle.innerHTML = key;
// })


//Allows the User to hold down shift and move around with the mouse rather than using the arrow keys
var timer = null;
document.addEventListener('keydown',function(event){
	var key = event.key;
	if(key=='Shift'){
		timer = setInterval(function(){
		if(MOUSEX<=HALFCANVASX){
				socket.emit('movement',{
					vx: -10,
					vy: 0
				})
			}
		 if(MOUSEX>=HALFCANVASX){
				socket.emit('movement',{
					vx: 10,
					vy: 0
				})
			}

			if(MOUSEY<=HALFCANVASY){
				socket.emit('movement',{
					vx: 0,
					vy: -10
				})
			}
			 if(MOUSEY>=HALFCANVASY){
				socket.emit('movement',{
					vx: 0,
					vy: 10
				})
			}
	},100);
	}
	
})

document.addEventListener('keyup',function(event){
	console.log("NOT HOLDING DOWN SHIFT");
	clearInterval(timer);
})

document.addEventListener('keydown', function(event){
	var key = event.key;

	if(key=="ArrowRight"){
		socket.emit('movement',{
			vx: 5,
			vy: 0
		})
	}
	else if(key=="ArrowLeft"){
		socket.emit('movement',{
			vx: -5,
			vy: 0
		})
	}
	if(key=="ArrowUp"){
		socket.emit('movement',{
			vx: 0,
			vy: -5
		})
	}
	else if(key=="ArrowDown"){
		socket.emit('movement',{
			vx: 0,
			vy: 5
		})
	}

	var abletomove = true;

	if(key == "s"){
		""
	}

	

})

//Keeps the player between the inputted x(leftmost,rightmost) and y(bottommost,topmost) positions
function keepInMapBounds(x,y,leftmost,rightmost,bottommost,topmost){
	if(x<leftmost){
		x = leftmost;
	}
	else if(x>rightmost){
		x = rightmost;
	}

	if(y<topmost){
		y = topmost;
	}
	else if(y>bottommost){
		y = bottommost;
	}

	return [x,y];
}

function updateDayNightCycle(canvasobject,daynightpercentage){
	canvasobject.style.filter = 'grayscale('+ daynightpercentage+'%)' ;
}

function drawRectangle(ctx, topleftposn, width, height, color){
	ctx.fillStyle = color;
	ctx.fillRect(topleftposn[0],topleftposn[1],width,height);
}

function drawMapReference(ctx,topleftposn,width,height,color, playerposn, mapsize){
	var player_radius = Math.ceil(((width+height)/2)*.01);
	var player_posnx_ratio = playerposn[0]/mapsize;
	var player_posny_ratio = playerposn[1]/mapsize;

	var player_posnx_map = (width*player_posnx_ratio)+topleftposn[0]; 
	var player_posny_map = (height*player_posny_ratio)+topleftposn[1];

	drawRectangle(ctx,topleftposn,width,height,color);

	drawCircle(player_posnx_map,player_posny_map,player_radius+1,SERVER_PLAYERS[SOCKET_ID].color);

}

function drawMapReference(ctx,topleftposn,width,height,color, mapsize, listofplayers){
	var player_radius = Math.ceil(((width+height)/2)*.01);
	drawRectangle(ctx,topleftposn,width,height,color);

	for(var key in listofplayers){
		var playerposn = [listofplayers[key].absx,listofplayers[key].absy];

		var player_posnx_ratio = playerposn[0]/mapsize;
		var player_posny_ratio = playerposn[1]/mapsize;

		var player_posnx_map = (width*player_posnx_ratio)+topleftposn[0]; 
		var player_posny_map = (height*player_posny_ratio)+topleftposn[1];


		drawCircle(player_posnx_map,player_posny_map,player_radius+1,listofplayers[key].color);
	}

}

//setInterval(GAMELOOP) sends to server 'giveplayers' to telling it to give the list of players back to the client
//The server then sends back 'getplayers' so that each client can deal with the 
//players' (drawing, updating, moving, etc)
socket.on('getelements',function(data){
	//Updating the Server Dictionaries
	SERVER_PLAYERS = data.players; //UPDATES THE LOCAL 'list_of_players' variable with the actual list of players from the server
	SERVER_GAME_ELEMENTS = data.gameelements;
	MAP_SIZE = data.mapsize; //updates the mapsize

	


	//UPDATING the number of players
	number_of_players = Object.keys(SERVER_PLAYERS).length; //Updates how many players there are in the server
	updateNumberOfPlayersDisplay(number_of_players);
	


	//UPDATING the client's player position on the client side
	if(SOCKET_ID in data.players){
		var player = data.players[SOCKET_ID]; //current client's player

		//Checks to see if the player is within the map and if hes out of bounds places them in bounds
		var newabsposn = keepInMapBounds(player.absx,player.absy,0,MAP_SIZE,MAP_SIZE,0);
		player.absx = newabsposn[0];
		player.absy = newabsposn[1];

		//Updates the Client's 'PLAYER_X' and 'PLAYER_Y' variables which keep track of the CLIENT's player's position locally
		PLAYER_X = player.absx;
		PLAYER_Y = player.absy;
	}
})

//When the sends back 'recievedmessage', the data carried is the contents of the message such as who sent it,
//the position of where to add it, and the message itself (text)
//A 'Message' object is then created through 'addMessage'
socket.on('receivedmessage', function(data){
	addMessage(data.x,data.y,data.text,data.isdisplayed,data.owner, chat,data.player_name, data.player_color);
	updateChatScrollBar(chat); //keeps the scrollbar at the bottom of the chat
})

socket.on('playerconnected',function(data){
	console.log("PLAYER CONNECTED");
	chat.innerHTML+= "<div style = 'color:#42f4f4'><b>"+data.playername+" has connected to the game.</b></div>";
	updateChatScrollBar(chat);
})

socket.on('playerdisconnected',function(data){
	console.log("PLAYER DISCONNECTED");
	chat.innerHTML+= "<div style = 'color:#42f4f4'><b>"+data.playername+" has disconnected.</b></div>";
	updateChatScrollBar(chat);
})

socket.on('UpdateDayTime',function(data){
	DAY_NIGHT_PERCENTAGE = data.day_night_percentage;
	updateDayNightCycle(canvas,DAY_NIGHT_PERCENTAGE);
	console.log(DAY_NIGHT_PERCENTAGE);
})

var testelephant = new Sprite(ctx,'asianelephant.png',0,0,16,16,50,50,50,50,0,3,60,1);
var testelephant2 = new Sprite(ctx,'asianelephant.png',0,0,16,16,100,100,100,100,1,3,60,10);
var oil = new Sprite(ctx,'oil.png',0,0,16,16,300,100,60,60,0,6,60,5);

//StableSprite(ctx, imgpath,imgwidth,imgheight, x,y, canvasx, canvasy)
//var rocksheet = new Imagesheet(ctx, 'rocks.png',16,16, 64, 64,32,32);
var testimage = new Image();
testimage.src = 'trees.png';

//CLIENT GAME LOOP
setInterval(function(){
	socket.emit('giveelements'); //Returns server information such as the players, game elements, mapsize to the client

	//DRAW AND UPDATE EVERYTHING IN HERE
	clearCanvas();
	addImagesAndSprites(SERVER_GAME_ELEMENTS);


	//function drawMapReference(ctx,topleftposn,width,height,color, playerposn, mapsize){
	try{
		drawPlayers(SERVER_PLAYERS); //takes the local listofplayers variable (it is updated in 'getelements') and draws the players
		drawMessages();
		drawABSLocation();
		drawMapReference(ctx,[5,25],(canvas.width*0.15),(canvas.height*0.15),'rgba(0,0,0,0.5)',MAP_SIZE, SERVER_PLAYERS);
	}
	catch(err){
		'';
	}
	

},Math.floor(1000/FPS)); //60 frames per 1000ms (1 second)

