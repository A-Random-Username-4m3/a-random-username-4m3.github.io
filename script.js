const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

const main=$("#main");
const side=$("#side");
const scrim=$("#scrim");
const menuBtn=$("#menuBtn");
const header=$("#topHeader");

function isMobile(){ return matchMedia("(max-width:780px)").matches; }

function syncHeaderHeight(){
	// Keeps the mobile content aligned under the header even if it wraps.
	document.documentElement.style.setProperty("--header-h", header.offsetHeight + "px");
}

function setMenu(open){
	if(!isMobile()) return;
	side.classList.toggle("open", open);
	scrim.classList.toggle("show", open);
	scrim.setAttribute("aria-hidden", String(!open));
	menuBtn.setAttribute("aria-expanded", String(open));
}

menuBtn?.addEventListener("click", ()=> setMenu(!side.classList.contains("open")));
scrim?.addEventListener("click", ()=> setMenu(false));

/* Smooth scroll within the main panel */
function sectionTopInMain(section){
	// robust: compute section top relative to the scroll container
	const mr = main.getBoundingClientRect();
	const sr = section.getBoundingClientRect();
	return (sr.top - mr.top) + main.scrollTop;
}

$$("[data-nav]").forEach(a=>{
	a.addEventListener("click",(e)=>{
		const href=a.getAttribute("href");
		if(href?.startsWith("#")){
			e.preventDefault();
			const t=$(href);
			if(!t) return;

			const top = Math.max(0, sectionTopInMain(t) - 6);
			const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
			main.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });

			// focus for accessibility (without jumping)
			t.focus({preventScroll:true});
			setMenu(false);
		}
	});
});

/* Active nav highlight — scroll-position based (more reliable than IO here) */
const navLinks=$$("a.navlink[data-nav]");
const sections=navLinks.map(a=>$(a.getAttribute("href"))).filter(Boolean);

function updateActiveNav(){
	const y = main.scrollTop + 12; // offset to feel “natural”
	let active = sections[0] || null;

	for(const s of sections){
		const top = sectionTopInMain(s);
		if(top <= y) active = s;
	}
	if(!active) return;

	const id = "#" + active.id;
	navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === id));
}

let ticking=false;
main.addEventListener("scroll", ()=>{
	if(ticking) return;
	ticking=true;
	requestAnimationFrame(()=>{
		updateActiveNav();
		ticking=false;
	});
});

/* Logo = scroll to top */
$("#homeBtn").addEventListener("click", ()=>{
	const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
	main.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
});

/* Lightbox (placeholder) */
const modal=$("#modal"), closeBtn=$("#closeBtn"), title=$("#modalTitle");
function openModal(t){ title.textContent=t||"Preview"; modal.classList.add("open"); closeBtn.focus(); }
function closeModal(){ modal.classList.remove("open"); }
// Apply thumbnail images (backgrounds) based on data-thumb
$$(".tile[data-open]").forEach(tile=>{
  const imgUrl = tile.getAttribute("data-img");
  const thumb = tile.querySelector(".thumb");
  if(imgUrl && thumb){
    thumb.style.backgroundImage = `url("${imgUrl}")`;
    thumb.classList.add("hasImage");
  }

  tile.addEventListener("click", ()=>{
    const titleText = tile.getAttribute("data-open") || "Preview";
    const alt = tile.getAttribute("data-alt") || titleText;

    openModal(titleText);

    // Put the full image into the modal preview
    const preview = $("#preview");
    preview.innerHTML = ""; // clear placeholder text/old image

    if (imgUrl) {
        const img = new Image();
        img.src = imgUrl;
        img.alt = alt;
        img.style.margin = "auto";
        img.style.display = "block";

		img.onload = () => {
          	const aspectRatio = img.naturalWidth / img.naturalHeight;
            const windowAspectRatio = window.innerWidth / window.innerHeight;
			if (windowAspectRatio > aspectRatio) {
				img.style.height = "100%"; 
				img.style.width = "auto";
			} else {
				img.style.width = "100%"; 
				img.style.height = "auto";
			}
			preview.appendChild(img);
		}

    }
  });
});
closeBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e)=>{ if(e.target===modal) closeModal(); });
document.addEventListener("keydown",(e)=>{ if(e.key==="Escape") closeModal(); });

/* Keep layout stable */
addEventListener("resize", ()=>{
	syncHeaderHeight();
	if(!isMobile()) setMenu(false);
});
addEventListener("load", ()=>{
	syncHeaderHeight();
	updateActiveNav();
});