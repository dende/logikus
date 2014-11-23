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
				if (this[c1.y][c1.x].shortCut(c1, c2)){
					if (!this[c2.y][c2.x].shortCut(c2, c1)){
						this.disconnect(c1, c2);
						return false;
					}
				}
			} else {
				//c1 and c2 are ouputs, maybe todo?!
				return false;
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
			var lightBulbs = null;
			while (lightBulbs = this.Logikus.lightBulbs.pop()){
				lightBulbs.remove();
			}

			for (var i = 0; i < 11; i++){
				for (j = (i == 0)?0:1; j < 11; j++){
					this[i][j].powered = false;
				}
			}

			this.magic(0,0);
			this.Logikus.letThereBeLight();
		};

		this.wizardry.magic = function (y,x) {
			if (!this[y][x].powered){
				this[y][x].powered = true;
				var bridge = false;

				if (y == 0){
					if (x == 0){
						bridge = true;
					}
				} else if (y > 0){
					if (y % 2 == this.Logikus.levers[x]){
						bridge = true;
					}
				}
				if (bridge){
					for (var i = -1; i < 2; i++){
						var coords = this[y][x].out[i];
						if (coords != null){
							this.magic(coords.y, coords.x);
						}
					}
				}
				if (y > 0){
					for (var i = -1; i < 2; i++){
						var coords = this[y][x].short[i];
						if (coords != null){
							this.magic(coords.y, coords.x);
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
	}
}

function Node(){
	this.powered = false;
	this.in = {"-1": null, "0": null, "1": null};
	this.out = {"-1": null, "0": null, "1": null};
	this.short = {"-1": null, "0": null, "1": null};

	this.connectIn = function (c1,c2) {
		if (this.in[c1.i] == null && this.short[c1.i] == null){
			this.in[c1.i] = c2;
			return true
		} else {
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

	this.shortCut = function (c1,c2) {
		if (this.in[c1.i] == null && this.short[c1.i] == null){
			this.short[c1.i] = c2;
			return true
		} else {
			return false;
		}
	}

	this.remove = function (c1){
		if (c1.j < 0){
			this.in[c1.i] = null;
			this.short[c1.i] = null;
		} else {
			this.out[c1.i] = null;
		}
	};
}

function SourceNode(){
	this.powered = false;
	this.out = {"-1": null, "0": null, "1": null};


	this.connectOut = function (c1,c2) {
		if (this.out[c1.j] == null){
			this.out[c1.j] = c2;
			return true;
		} else {
			return false;
		}
	};

	this.remove = function (c1){
		this.out[c1.j] = null;
	};

}

function LightNode(){
	this.powered = false;
	this.in = {"-1": null, "0": null, "1": null};


	this.connectIn = function (c1,c2) {
		if (this.in[c1.j] == null){
			this.in[c1.j] = c2;
			return true
		} else {
			return false;
		}
	};

	this.remove = function (c1){
		this.in[c1.j] = null;
	};


}

Logikus.setup();