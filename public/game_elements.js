//CLASSES-----------------------------------------------------
function Message(x,y,text,isdisplayed, owner){
	this.text = text;
	this.isdisplayed = isdisplayed;
	this.x = x;
	this.y = y;
	this.owner = owner;
}


//USED FOR SPRITESHEETS TO DRAW INDIVIDUAL STATIC IMAGES ONTO THE CANVAS
function Imagesheet(ctx, imgpath,imgwidth,imgheight,canvasx, canvasy){
	this.ctx = ctx;
	this.canvasx = canvasx //the width of the image on the canvas
	this.canvasy = canvasy //the height of the image on the canvas
	this.imgpath = imgpath;
	this.imgx = 0;  //x posn of image (to crop out sections of the image TOP LEFT)
	this.imgy = 0;  //y posn of image 
	this.imgwidth = imgwidth //the width of the image section
	this.imgheight = imgheight //the height of the image section
	this.image = new Image();
	this.image.src = imgpath; //name of the image (in this case)


	this.sheet = 'imagesheet';

	//Crops out a section of image and draws onto the canvas
	//NOTE ROW AND COLUMN START AT 0 (for the first row and column)
	//EX: if there are 7 columns of pictures, then input 6 as the columns argument
	//Draws the image at the exact x,y (with x,y being the CENTER of the image)
	this.drawimage = function(x,y,row, column){
		this.imgx = (imgwidth*column);
		this.imgy = (imgheight*row);

		//This Shifts the image to the actual inputted x,y position (CENTERS THE IMAGE)
		var offsetx = Math.floor(x-(this.canvasx/2));
		var offsety = Math.floor(y-(this.canvasy/2));

		this.ctx.drawImage(this.image, this.imgx,this.imgy, this.imgwidth,this.imgheight,offsetx,offsety,this.canvasx, this.canvasy);
}

	this.drawimage = function(x,y,row, column, canvassizex, canvassizey){
		this.imgx = (imgwidth*column);
		this.imgy = (imgheight*row);

		//This Shifts the image to the actual inputted x,y position (CENTERS THE IMAGE)
		var offsetx = Math.floor(x-(canvassizex/2));
		var offsety = Math.floor(y-(canvassizey/2));

		this.ctx.drawImage(this.image, this.imgx,this.imgy, this.imgwidth,this.imgheight,offsetx,offsety,canvassizex, canvassizey);
}


	this.drawimage_NoOffset = function(x,y,row, column){
	this.imgx = (imgwidth*column);
	this.imgy = (imgheight*row);

	this.ctx.drawImage(this.image, this.imgx,this.imgy, this.imgwidth,this.imgheight,x,y,this.canvasx, this.canvasy);
}
}
//Returns a random number from [0,number] +offset
function randomNum(number,offset){
	return Math.floor((Math.random()*number) +offset); //EX: number== 10, offset ==0, gets a number from 0-9 INCLUSIVE
}

//class version instead of function 
class Sprite{
	constructor(ctx, imgpath, imgx, imgy, imgwidth,imgheight, x,y, canvasx, canvasy, row,numcolumns, fps, numframes){
		this.x=x;  //x posn of the canvas (where to draw the image TOP LEFT)
		this.y=y;  //y posn of the canvas
		this.canvasx = canvasx //the width of the image on the canvas
		this.canvasy = canvasy //the height of the image on the canvas
		this.imgpath = imgpath;
		this.imgx = imgx;  //x posn of image (to crop out sections of the image TOP LEFT)
		this.imgy = imgy;  //y posn of image 
		this.imgwidth = imgwidth //the width of the image section
		this.imgheight = imgheight //the height of the image section
		this.row = row; //the row that is being drawn from the spritesheet (NOTE STARTS AT 0, row0 == the toprow)
		this.numcolumns =numcolumns; //the number of columns on the spritesheet (NOTE STARTS AT 0, column0 == leftmost column)
		this.fps = fps; //the frames per second (currently 60 in-game)
		this.numframes; //How many frames per second to draw out the sprite (1 frame ==slow 60 frames ==fast MAX==60 fps currently)
		this.ctx = ctx;

		this.sheet ='spritesheet';

		//Frames,Updating
		this.threshold = fps/numframes; //gives us a threshold of when to increment img index
		this.ticks = 0; //Once ticks is greater than the threshold, it updates the frameindex EX: 60fps means that the number of ticks incremented is 60 per second,
						//if our threshold is 60 then this means it updates the image to its next animation frame once a second
		this.frameindex = randomNum(numframes,0);// this.index*imgwidth

		//Image
		this.image = new Image();
		this.image.src = imgpath; //name of the image (in this case)
	}


	//Crops out a section of image and draws onto the canvas
	drawimage(){
		this.ctx.drawImage(this.image, this.imgx,this.imgy, this.imgwidth,this.imgheight,this.x,this.y,this.canvasx, this.canvasy);

	}

	//Draws the image at the exact x,y (with x,y being the CENTER of the image)
	drawimage(x,y){
		//This Shifts the image to the actual inputted x,y position (CENTERS THE IMAGE)
		var offsetx = Math.floor(x-(this.canvasx/2));
		var offsety = Math.floor(y-(this.canvasy/2));

		this.ctx.drawImage(this.image, this.imgx,this.imgy, this.imgwidth,this.imgheight,offsetx,offsety,this.canvasx, this.canvasy);

	}

	//Draws the image at x,y (with x,y being the TOPLEFT of the image)
	drawimage_NoOffset(x,y){
	this.ctx.drawImage(this.image, this.imgx,this.imgy, this.imgwidth,this.imgheight,x,y,this.canvasx, this.canvasy);

	}



	//Row starts at 0 (row 0 means the topmost row on the spritesheet)
	changeImageRow(row){
		this.row = row;
	}

	//COMPLETELY WORKS (do not fix what is not broken)
	//If player wants the topmost row then var row =0
	//If the player wants the fourth column then var column =3
	update(){
			//loops through the image frames		
		if(this.ticks>this.threshold){
			this.ticks =0;
			this.frameindex+=1;

			//Shifts along the index by how big the image width/heights are and by at which frameindex the animation is at
			this.imgy = this.imgheight *this.row;
			this.imgx = this.imgwidth *this.frameindex;

		}

		//resets the animation frame back to the beginning image
		if(this.frameindex>=this.numcolumns){
			this.frameindex=-1;
		}


		//Frames
		this.ticks+=1;
	}
}