var Logikus = {

	selectedRect : null,
	selectedLine : null,
	canvas : null,
	patchbay : null,
	colWidth : 90,
	rowHeight : 59,
	connectorSize: 10,
	connectorOffset: 15,
	wizardry : null,
	levers: null,
	lights: null,
	workingOn: null,
	done: null,
	lightBulbs: null,
	highlights: null,
	setup : function () {
		this.setupCanvas();
		this.setupWizardry();
		this.setupEventListeners();
		this.drawLamps();
		this.drawUpperRow();
		this.drawPatchbay();
		this.drawControls();
	},

	setupCanvas : function() {
		this.canvas = new fabric.Canvas('logikus');
		this.canvas.selection = false;
	},

	setupWizardry : function () {
		this.levers = [0,0,0,0,0,0,0,0,0,0,0];
		this.lamps = [0,0,0,0,0,0,0,0,0,0];
		this.lightBulbs = [];
		this.highlights = [];
		this.wizardry = {Logikus: Logikus};
		for (var i = 0; i < 11; i++){
			this.wizardry[i] = {}
			if (i == 0){
				this.wizardry[i][0] = new SourceNode();
				for (var j = 1; j < 11; j++){
					this.wizardry[i][j] = new LightNode();
				}
			} else {
				for (var j = 1; j < 11; j++){
					this.wizardry[i][j] = new Node();
				}
			}
		}

		this.wizardry.connect = function (c1, c2) {
			if (this.isInput(c1) && this.isOutput(c2) || this.isOutput(c1) && this.isInput(c2)){
				if (this.isInput(c1)){
					if (this[c1.y][c1.x].connectIn(c1, c2)){
						if (!this[c2.y][c2.x].connectOut(c2, c1)){
							this.disconnect(c1,c2);
							return false;
						}
					}
				} else {
					//this.isInput(c2) == true
					if (this[c2.y][c2.x].connectIn(c2, c1)){
						if (!this[c1.y][c1.x].connectOut(c1, c2)){
							this.disconnect(c1,c2)
							return false;
						}
					}	
				} 
			} else if (this.isInput(c1) && this.isInput(c2)){
				if (this[c1.y][c1.x].shortCutIn(c1, c2)){
					if (!this[c2.y][c2.x].shortCutIn(c2, c1)){
						this.disconnect(c1, c2);
						return false;
					}
				}
			} else {
				//c1 and c2 are ouputs, maybe todo?!
				if (this[c1.y][c1.x].shortCutOut(c1,c2)){
					if (!this[c2.y][c2.x].shortCutOut(c2,c1)){
						this.disconnect(c1, c2);
						return false;
					}
				}
			}

			return true;
		};

		this.wizardry.disconnect = function (c1, c2) {
			this[c1.y][c1.x].remove(c1);
			this[c2.y][c2.x].remove(c2);
		};


		this.wizardry.isInput = function (coords) {
			if (coords.y == 0){
				if (coords.x == 0){
					return false;
				}
				return true;
			} else {
				if (coords.j == -1){
					return true;
				}
				return false;
			}
		};

		this.wizardry.isOutput = function (coords) {
			return !this.isInput(coords);
		};

		this.wizardry.doWizardry = function () {
			var lightBulb = null;
			while (lightBulb = this.Logikus.lightBulbs.pop()){
				lightBulb.remove();
			}

			var highlight = null;
			while (highlight = this.Logikus.highlights.pop()){
				highlight.remove();
			}

			for (var i = 0; i < 11; i++){
				if (i == 0){
					for (j = 0; j < 11; j++){
						this[i][j].powered = false;
					}
				} else {
					for (j = 1; j < 11; j++){
						this[i][j].powered.left = this[i][j].powered.right = false;
					}
				}
			}

			this.magic(0,0);
			this.Logikus.letThereBeLight();
		};

		this.wizardry.magic = function (y,x,dir) {
			if (dir == "left"){
				if (y == 0){
					if (!this[y][x].powered){
						this[y][x].powered = true;
						this[y][x].powerOn(y,x);
						return;
					}
				}
				if (!this[y][x].powered.left){
					this[y][x].powered.left = true;
					this[y][x].powerOn(y,x,dir);
					if (y % 2 == this.Logikus.levers[x]){
						this.magic(y,x,"right");
					}


					for (var i = -1; i < 2; i++){
						var coords = this[y][x].in[i];
						if (coords != null){
							this.magic(coords.y, coords.x, "right");
						}
						coords = this[y][x].shortIn[i];
						if (coords != null){
							this.magic(coords.y, coords.x, "left");
						}
					}

				}
			} else if (dir == "right"){
				if (y == 0){return;}
				if (!this[y][x].powered.right){
					this[y][x].powered.right = true;
					this[y][x].powerOn(y,x,dir);

					if (y % 2 == this.Logikus.levers[x]){
						this.magic(y,x,"left");
					}


					for (var i = -1; i < 2; i++){
						var coords = this[y][x].out[i];
						if (coords != null){
							this.magic(coords.y, coords.x, "left");
						}
						coords = this[y][x].shortOut[i];
						if (coords != null){
							this.magic(coords.y, coords.x, "right");
						}
					}
				}


			} else {
				if (y == 0){
					if (x == 0){
						this[y][x].powerOn();
						for (var j = -1; j < 2; j++){
							var coords = this[y][x].out[j];
							if (coords != null){
								this.magic(coords.y, coords.x, "left");
							}
							coords = this[y][x].shortOut[j];
							if (coords != null){
								this.magic(coords.y, coords.x, "right");
							}
						}
					}
				} 
			}

		}
	},

	setupEventListeners : function () {

		var check = function check(e) {
			if (e.keyCode == 46){
				//remove  button clicked
				if (selectedLine != null){
					Logikus.disconnect(selectedLine);
				}
			} else if (e.keyCode == 83){
				Logikus.saveState();
			} else if (e.keyCode == 76){
				var state = window.prompt("Enter state");
				if (state != ""){
					Logikus.loadState(state);
				}
			}
		}

		window.addEventListener('keydown',check,false);

		var that = this;
		this.canvas.on('mouse:down', function(options){that.mouseDownHandler(options)});

	},

	mouseDownHandler : function (options){
		if (options.target != undefined) {
			if (options.target.type == 'rect') {
				if (options.target.hasOwnProperty('matrix')) {
					//we're on the patchbay
					if (this.selectedRect === null) {
						this.selectRect(options.target);
					} else {
						temp = this.selectedRect;
						this.unselectRect();
						this.connect(temp, options.target);
					}
				} else if (options.target.hasOwnProperty('pos')) {
					//lever?
					this.switchLever(options.target);
				}
			}
		}

		if (options.target == undefined || options.target.type != 'rect'){
			this.unselectRect();
		}
	},
 
 	drawLamps : function () {
		for (var x = 1; x < 11; x++){
			this.drawLamp(x);
		}
	},

	drawUpperRow : function () {
		for (var x = 0; x < 11; x++){
			for (var j = -1; j < 2; j++){
				this.drawSmallConnector({x: x, y: 0, j: j});	
			}
		}
	},

	drawPatchbay : function () {
		for (var y = 1; y < 11; y++){
			for (var x = 1; x < 11 ; x++){
				for (var i = -1; i < 2; i++){
					for (var j = -1; j < 3; j += 2){
						this.drawConnector({y: y, x: x, i: i, j: j});
					}
				}
			}
		}
	},

	drawControls : function () {
		var top = this.canvas.height - 80;
		for (var x = 1; x < 11; x++){
			this.addLever(x);
			//todo this.addButton(x);
		}
	},

	drawConnection : function (c1,c2){
		var selectedRealCoords = this.getConnectorCoords(c1);
		var targetRealCoords = this.getConnectorCoords(c2);
		var color = [255,Math.floor(Math.random() * 100), Math.floor(Math.random() * 100)]
		var hex = color.map(function(dec){return ("00" + dec.toString(16)).substr(-2,2);});
		var line = new fabric.Line([selectedRealCoords.left + 5, selectedRealCoords.top + 5, targetRealCoords.left + 5, targetRealCoords.top + 5], {
			stroke: '#' + hex.join(''),
			strokeWidth: 4,
			selectable: true,
			originX: 'center',
			originY: 'center',
			lockMovementX: true,
			lockMovementY: true,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			hasControls: false,
			connects: [c1,c2]
		});

		line.on('selected', function (e) {
			selectedLine = this;
		});

		this.canvas.add(line);
		this.canvas.sendToBack(line);

	},

	getConnectorCoords : function (coords) {
		if (coords.hasOwnProperty('i')){
			//patchbay
			if (coords.y%2 == 1){
				//this is used to make the vertical spacing uneven
				extraPaddingy = 4;
			} else {
				extraPaddingy = -4;
			}

			var top = ((coords.y + 1) * this.rowHeight) + (coords.i * this.connectorOffset) + extraPaddingy;
		} else {
			//upper row
			var top = 1.3 * this.rowHeight;
		}

		var left = ((coords.x + .5) * this.colWidth) + coords.j * this.connectorOffset;

		return {left: left, top: top};
	},

	getSmallConnectorCoords : function (coords) {
		var top = 1.3 * this.rowHeight;
		return {top: top, left: left};
	},

	selectRect : function (target) {
		this.selectedRect = target.matrix;
		target.remove();
	},

	connect : function (temp, target) {
		//todo divide drawing from logic, but whatevs
		if (this.wizardry.connect(temp,target.matrix)){
			this.drawConnection(temp,target.matrix);
			this.wizardry.doWizardry();
		}
	},

	disconnect : function (line){
		line.remove();
		this.wizardry.disconnect(line.connects[0], line.connects[1]);
		this.wizardry.doWizardry();
	},

	unselectRect : function () {
		if (this.selectedRect != null){
			this.drawConnector(this.selectedRect);
			this.selectedRect = null;
		}
	},

	drawConnector : function (coords) {

		var realCoords = this.getConnectorCoords(coords);

		var rect = new fabric.Rect({
			left: realCoords.left,
			top: realCoords.top,
			fill: 'black',
			width: this.connectorSize,
			height: this.connectorSize,
			selectable: true,
			lockMovementX: true,
			lockMovementY: true,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			hasControls: false,
			matrix: coords,
			hoverCursor: 'pointer',
		});
		this.canvas.add(rect);
	},

	drawSmallConnector : function (coords) {

		realCoords = this.getConnectorCoords(coords);

		var rect = new fabric.Rect({
			left: realCoords.left,
			top: realCoords.top,
			fill: 'black',
			width: this.connectorSize,
			height: this.connectorSize,
			selectable: true,
			lockMovementX: true,
			lockMovementY: true,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			hasControls: false,
			matrix: coords,
		});
		this.canvas.add(rect);
	},

	addLever : function (x) {

		var width = .1 * this.colWidth;
		var left = (x + .55) * this.colWidth - .5 * width;
		var top = this.canvas.height - this.rowHeight;
		var rect = this.makeRect({left: left, top: top, width: width, height: this.rowHeight});
		this.canvas.add(rect);

		left = (x + .45) * this.colWidth - .5 * width;
		top = this.canvas.height - this.rowHeight + .7 * this.rowHeight;
		width = .3 * this.colWidth;
		var rect2 = this.makeRect({left: left, top: top, width: width, height: .3 * this.rowHeight});

		rect2.x = x;
		rect2.pos = 'down';
		this.canvas.add(rect2);

	},

	switchLever : function (lever) {
		var leverTop = lever.getTop();
		var topPosition = this.canvas.height - this.rowHeight + .7 * this.rowHeight;
		var bottomPosition = this.canvas.height - this.rowHeight;
		var newPos = leverTop == topPosition ? bottomPosition : topPosition;
		if (newPos == topPosition){
			lever.pos = 'down';
			this.levers[lever.x] = 0;
		} else {
			lever.pos = 'up';
			this.levers[lever.x] = 1;
		}

		console.log("moved lever " + lever.x + " " + lever.pos)

		lever.animate('top', newPos, {
			duration: 500,
			onChange: this.canvas.renderAll.bind(this.canvas),
			easing: fabric.util.ease['easeInOutExpo'],
		});

		this.wizardry.doWizardry();

	},

	drawLamp : function (x) {
		var top = 1;
		var size = this.colWidth - 20;
		var left = x * this.colWidth + 15;

		var rect = this.makeRect({left: left, top: top, fill: 'white', width: size, height: size});

		this.canvas.add(rect);

	},

	Lights : function (x){
		var d = this.colWidth - 22;
		this.lightBulbs.push( new fabric.Circle({
			radius : d * .5,
			fill: 'yellow',
			top: 2,
			left: x * this.colWidth + .5 * (this.colWidth - this.rowHeight),
			selectable: false,
			hasControls: false,
			lockMovementX: true,
			lockMovementY: true,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,

		}));

		this.canvas.add(this.lightBulbs[this.lightBulbs.length -1]);

	},

	letThereBeLight : function () {
		for (var i = 1; i < 11; i++){
			if (this.wizardry[0][i].powered){
				this.Lights(i);
			}
		}
	},

	makeRect : function (data) {
		var rect = new fabric.Rect({
			left: data.left,
			top: data.top,
			width: data.width,
			height: data.height,
			fill: data.fill || "black",
			stroke: data.stroke || "black",
			selectable: data.selectable || false,
			hasControls: false,
		});

		return rect;
	},

	getIdentifier : function (coords){
		var rows = ["X","A","B","C","D","E","F","G","H","I","J","K"];
		var cols = ["X", 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		var inout = {"-1": "a", "1": "b"};
		var vpos = {"-1": "o", "0": "m", "1": "u"};
		var hpos = {"-1": "l", "0": "m", "1": "r"};

		if (coords.y==0){
			return rows[coords.y] + cols[coords.x] + hpos[coords.j];
		} else {
			return rows[coords.y] + cols[coords.x] + inout[coords.j] + vpos[coords.i];
		}

	},

	getCoordsFromIdentifier : function (identifier){
		var rows = {X: 0, A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10};
		var cols = {"X": 0, "0": 1, "1": 2, "2": 3, "3": 4, "4": 5, "5": 6, "6": 7, "8": 9, "9": 10};
		var inout = {a: -1, b: 1};
		var vpos = {o: -1, m: 0, u: 1};
		var hpos = {l: -1, m: 0, r: 1};

		if (identifier[0] == "X"){
			return {y: 0, x: cols[identifier[1]], j: hpos[identifier[2]]};
		} else {
			return {y: rows[identifier[0]], x: cols[identifier[1]], i: vpos[identifier[3]], j: inout[identifier[2]]}
		}
	},

	saveState : function (){
		console.log("saving state");
		var temp = {};
		temp.add = function(node, otherNode){
			if (!this.hasOwnProperty((on = Logikus.getIdentifier(otherNode)))){
				temp[Logikus.getIdentifier(node)] = on;
			}
		}
		var node = null;
		var otherNode = null;
		for (var y = 0; y < 11; y++){
			for (var x = 0; x < 11; x++){
				node = this.wizardry[y][x];
				if (y == 0){
					if (x == 0){
					for (var j = -1; j < 2; j++){
						otherNode = null;
						otherNode = node.out[j];
						if (otherNode != null){
							temp.add({y: y, x: x, j: j}, otherNode);
						}
						otherNode = node.shortOut[j];
						if (otherNode != null){
							temp.add({y: y, x: x, j: j}, otherNode);
						}
					}

					} else {
					for (var j = -1; j < 2; j++){
						otherNode = null;
						otherNode = node.in[j];
						if (otherNode != null){
							temp.add({y: y, x: x, j: j}, otherNode);
						}
						otherNode = node.shortIn[j];
						if (otherNode != null){
							temp.add({y: y, x: x, j: j}, otherNode);
						}
					}
					}
				} else {
					if (x>0){
						for (var i = -1; i < 2; i++){
							for (var j = -1; j < 2; j = j+2){
								otherNode = null;
								if (j == -1){
									otherNode = node.in[i];
								} else {
									otherNode = node.out[i];
								}
								if (otherNode != null){
									temp.add({y: y, x: x, j: j, i: i}, otherNode);
								}
								if (j == -1){
									otherNode = node.shortIn[i];
								} else {

									otherNode = node.shortOut[i];
								}
								if (otherNode != null){
									temp.add({y: y, x: x, j: j, i: i}, otherNode);
								}
							}
						}
					}
				}
			}
		}
		console.log(JSON.stringify(temp));
	},

	loadState : function(state){
		var rows = {X: 0, A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10};
		var cols = {X: 0, 0: 1, 1: 2, 2: 3, 4: 5, 5: 6, 6: 7, 8: 9, 9: 10};
		var inout = {a: -1, b: 1};
		var vpos = {o: -1, m: 0, u: 1};
		var hpos = {l: -1, m: 0, r: 1};

		Logikus.setupWizardry();
		nodes = JSON.parse(state);

		for (var node in nodes){
			if (nodes.hasOwnProperty(node)){
				otherNode = nodes[node];


				c1 = this.getCoordsFromIdentifier(node);
				c2 = this.getCoordsFromIdentifier(otherNode);

				Logikus.wizardry.connect(c1,c2);
				Logikus.drawConnection(c1,c2);
				Logikus.wizardry.doWizardry();


				/*
				if (c1.y == 0){
					if (c1.x == 0){
						n1 = SourceNode();
						if (c2.y == 0){
							//LightNode
							n2 = LightNode();
							n1.connectOut(c2);
							n2.connectIn(c1);
						} else {
							n2 = Node();
							if (c2.j == -1){
								n1.connectOut(c2);
								n2.connectIn(c1);
							} else {
								n1.shortCutOut(c2);
								n2.shortCutOut(c1);
							}
						}
					} else {
						n1 = LightNode();
						n2 = Node();
						if (c2.j == -1){
							n1.shortCutIn(c2);
							n2.shortCutIn(c1);
						} else {
							n1.connectIn(c2);
							n2.connectOut(c1);
						}
					}
				} else {
					n1 = Node();
					n2 = Node();
					if (c1.j == -1){
						if (c2.j == -1){
							n1.shortCutIn(c2);
							n2.shortCutIn(c1);
						} else {
							n1.connectIn(c2);
							n2.connectOut(c1);
						}
					} else {
						if (c2.j == -1){
							n1.connectOut(c2);
							n2.connectIn(c1);
						} else {
							n1.shortCutOut(c2);
							n2.shortCutOut(c1);
						}
					}
				}
			}
			Logikus.wizardry[c1.y][c1.x] = n1;
			Logikus.wizardry[c2.y][c2.x] = n2;
			*/
			}
		}
	}
}

function Node(){
	this.powered = {left: false, right: false};
	this.in = {"-1": null, "0": null, "1": null};
	this.out = {"-1": null, "0": null, "1": null};
	this.shortIn = {"-1": null, "0": null, "1": null};
	this.shortOut = {"-1": null, "0": null, "1": null};

	this.connectIn = function (c1,c2) {
		if (this.in[c1.i] == null && this.shortIn[c1.i] == null){
			this.in[c1.i] = c2;
			return true
		} else {lo
			return false;
		}
	};

	this.connectOut = function (c1,c2) {
		if (this.out[c1.i] == null){
			this.out[c1.i] = c2;
			return true;
		} else {
			return false;
		}
	};

	this.shortCutIn = function (c1,c2) {
		if (this.in[c1.i] == null && this.shortIn[c1.i] == null){
			this.shortIn[c1.i] = c2;
			return true;
		} else {
			return false;
		}
	};

	this.shortCutOut = function (c1,c2) {
		if (this.out[c1.i] == null && this.shortOut[c1.i] == null){
			this.shortOut[c1.i] = c2;
			return true;
		} else {
			return false;
		}
	};

	this.remove = function (c1){
		if (c1.j < 0){
			this.in[c1.i] = null;
			this.shortIn[c1.i] = null;
		} else {
			this.out[c1.i] = null;
			this.shortOut[c1.i] = null;
		}
	};

	this.powerOn = function(y,x,dir){
		realCoords = Logikus.getConnectorCoords({x:x,y:y,i:-1,j:dir=="left"?-1:1});
		var highlight = new fabric.Rect({
			left: realCoords.left - Logikus.connectorSize,
			top: realCoords.top - Logikus.connectorSize,
			fill: 'yellow',
			width: Logikus.connectorSize * 3,
			height: Logikus.connectorSize * 6,
			selectable: false,
			lockMovementX: true,
			lockMovementY: true,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			hasControls: false,
		});

		Logikus.highlights.push(highlight);
		Logikus.canvas.add(highlight);
		Logikus.canvas.sendToBack(highlight);
	}
}

function SourceNode(){
	this.powered = false;
	this.out = {"-1": null, "0": null, "1": null};
	this.shortOut = {"-1": null, "0": null, "1": null};

	this.connectOut = function (c1,c2) {
		if (this.out[c1.j] == null && this.shortOut[c1.j] == null){
			this.out[c1.j] = c2;
			return true;
		} else {
			return false;
		}
	};

	this.shortCutOut = function (c1,c2) {
		if (this.shortOut[c1.j] == null && this.out[c1.j] == null){
			this.shortOut[c1.j] = c2;
			return true;
		} else {
			return false;
		}
	};

	this.remove = function (c1){
		this.out[c1.j] = null;
		this.shortOut[c1.j] = null;
	};

	this.bridgeOn = function(){};

	this.powerOn = function(){

		realCoords = Logikus.getConnectorCoords({x:0,y:0,j:-1});

		var highlight = new fabric.Rect({
			left: realCoords.left - Logikus.connectorSize,
			top: realCoords.top - Logikus.connectorSize,
			fill: 'yellow',
			width: Logikus.connectorSize * 6,
			height: Logikus.connectorSize * 3,
			selectable: false,
			lockMovementX: true,
			lockMovementY: true,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			hasControls: false,
		});

		Logikus.highlights.push(highlight);
		Logikus.canvas.add(highlight);
		Logikus.canvas.sendToBack(highlight);
	};

}

function LightNode(){
	this.powered = false;
	this.in = {"-1": null, "0": null, "1": null};
	this.shortIn = {"-1": null, "0": null, "1": null};


	this.connectIn = function (c1,c2) {
		if (this.in[c1.j] == null && this.shortIn[c1.j] == null){
			this.in[c1.j] = c2;
			return true
		} else {
			return false;
		}
	};

	this.shortCutIn = function (c1,c2) {
		if (this.shortIn[c1.j] == null && this.in[c1.j] == null){
			this.shortIn[c1.j] = c2;
			return true
		} else {
			return false;
		}
	};

	this.remove = function (c1){
		this.in[c1.j] = null;
		this.shortIn[c1.j] = null;
	};

	this.powerOn = function(y,x){

		realCoords = Logikus.getConnectorCoords({x:x,y:y,j:-1});
		var highlight = new fabric.Rect({
			left: realCoords.left - Logikus.connectorSize,
			top: realCoords.top - Logikus.connectorSize,
			fill: 'yellow',
			width: Logikus.connectorSize * 6,
			height: Logikus.connectorSize * 3,
			selectable: false,
			lockMovementX: true,
			lockMovementY: true,
			lockScalingX: true,
			lockScalingY: true,
			lockRotation: true,
			hasControls: false,
		});

		Logikus.highlights.push(highlight);
		Logikus.canvas.add(highlight);
		Logikus.canvas.sendToBack(highlight);
	};
}

Logikus.setup();
