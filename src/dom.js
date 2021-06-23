export const div = (className="", content=null)=>{
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

	return div;

};
