export const div = (className="", content=null, options=null)=>{
	let div = document.createElement('div');
	
	// Assign classes
	let classNames = [];
	if (className) {
		if (className.indexOf(' ') > -1)
			classNames = className.split(' ');
		else if (className.indexOf(',') > -1)
			classNames = className.split(',');
		else
			classNames = [className];
		classNames.forEach(name=>div.classList.add(name));
	}

	// Assign content.
	if (content) {
		if (typeof content === 'string') {
			div.innerHTML = content;
		} else if (content instanceof Element) {
			div.append(content);
		} else if (Array.isArray(content) && content[0] instanceof Element) {
			content.forEach(c=>div.append(c));
		} else {
			console.error("Dom.newDiv :: Unknown content type.");
		}
	}

	if (options) {
		if (options.id) {
			div.setAttribute('id', options.id);
		}
	}

	return div;

};

export const truncate = (myNode) => {
	while (myNode.firstChild) {
		myNode.removeChild(myNode.lastChild);
	}
};

export const span = (chr, data, opts) => {
	let span = document.createElement('span');
	span.innerHTML = chr;
	if (data && Object.keys(data).length) {
		Object.keys(data).forEach(key => {
			span.setAttribute('data-' + key, data[key]);
		});
	}
	if (opts) {
		if (opts.enter) {
			span.addEventListener('mouseover', opts.enter);
		}
		if (opts.leave) {
			span.addEventListener('mouseout', opts.leave);
		}
		if (opts.click) {
			span.addEventListener('click', opts.click);
		}
	}
	return span;
}
