//CLASSES-----------------------------------------------------(classes we don't want the client to be able to access)
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
	constructor(category, id, posn, imgsize, type,tree_type){
		super(category, id, posn, imgsize, type);
		this.tree_type = tree_type;
	}

	grow(){
		var chance = randomNum(10000,0);
		var threshold = 5;
		if(chance<threshold && this.imgsize[0]<=100 && this.imgsize[1]<=100){
			var growth = 10;
			var newimgsize0 = this.imgsize[0]+growth;
			var newimgsize1 = this.imgsize[1]+growth;
			this.imgsize = [newimgsize0,newimgsize1];
			console.log("TREE GREW");
 		}
 		else{
 			//console.log("DID NOT GROW");
 		}
 		return;
	};
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




//EXPORTS
// module.exports.GameElement = GameElement;
// module.exports.Tree = Tree;
//module.exports.Player = Player;
//module.exports.Resources = Resources;