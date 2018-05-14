$(window).load(() => {
	$(window).resize(function() {
		resizeCanvas();
		mobileNav();
	});
	canvasCtx = $('#drawing-viewer')[0].getContext("2d");
	resizeCanvas();
	canvasCtx.strokeStyle = "#000000";
	var ongoingTouches = new Array();

	$('#drawing-viewer')[0].onpointerdown = function(event) {
		ongoingTouches.push(copyTouch(event));
		canvasCtx.beginPath();
	}
	$('#drawing-viewer')[0].onpointermove = function(event) {
		var pos = realPos(event);
		if (event.pressure > 0) {
			if (event.buttons === 32) {
				canvasCtx.clearRect(pos.x - 10, pos.y - 10, 20, 20);
			}
			else {
				var idx = ongoingTouchIndexById(event.pointerId);

				canvasCtx.beginPath();
				ongoingPos = realPos(ongoingTouches[idx]);
				canvasCtx.moveTo(ongoingPos.x, ongoingPos.y);
				canvasCtx.lineTo(pos.x, pos.y);
				canvasCtx.lineWidth = event.pressure * 10;
				canvasCtx.lineCap = "round";
				canvasCtx.stroke();

				ongoingTouches.splice(idx, 1, copyTouch(event));
			}
		}
	}
	$('#drawing-viewer')[0].onpointerup = function(event) {
		var pos = realPos(event);
		var idx = ongoingTouchIndexById(event.pointerId);
		if (idx >= 0 && event.buttons !== 32) {
			canvasCtx.lineWidth = event.pressure * 10;
			canvasCtx.fillStyle = "#000000";
			canvasCtx.beginPath();
			ongoingPos = realPos(ongoingTouches[idx]);
			canvasCtx.moveTo(ongoingPos.x, ongoingPos.y);
			canvasCtx.lineTo(pos.x, pos.y);

			ongoingTouches.splice(idx, 1);
		}
	}
	$('#drawing-viewer')[0].onpointercancel = function(event) {
		var idx = ongoingTouchIndexById(event.pointerId);
		ongoingTouches.splice(idx, 1);
	}
	function copyTouch(touch) {
		return { identifier: touch.pointerId, pageX: touch.pageX, pageY: touch.pageY };
	}

	function realPos(touchEvent) {
		return {
			x: touchEvent.pageX - canvasOffset.left,
			y: touchEvent.pageY - canvasOffset.top
		};
	}
	function ongoingTouchIndexById(idToFind) {
		for (var i = 0; i < ongoingTouches.length; i++) {
			var id = ongoingTouches[i].identifier;

			if (id == idToFind) {
				return i;
			}
		}
		return -1;
	}
});
