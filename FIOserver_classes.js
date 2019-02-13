//SERVER CLASSES (classes that hold simple data such as position, speed, etc)

//A simple game element
//(Sent down the socket.io socket and at the client is created into 
//a full object 
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
		this.amount = Math.floor(Math.sqrt((imgsizex*imgsizey))); //how much wood the tree holds for the players to take
		this.type = type; //EX: catergory== 'tree' -> type == 'birch', or category =="mineral" -> type =="iron"
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


	//Player Resources
	this.resources = new Resources();
}


function Resources(){
	this.logs = 0;
	this.rocks = 0;
	this.oil = 0;
	this.minerals = 0;
}

exports.SimpleGameElement = SimpleGameElement;
exports.Resource = Resource;
exports.Player = Player;
exports.Resources = Resources;


