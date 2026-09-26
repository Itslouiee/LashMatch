/* Leaflet location picker: the marker and form always use the same coordinates. */
(() => {
'use strict';
const $=s=>document.querySelector(s), center=[14.28,120.87];
const icon=()=>L.divIcon({className:'studio-location-marker',html:'<span></span>',iconSize:[24,32],iconAnchor:[12,32]});
function point(lat,lng){
 if(lat===null||lng===null||String(lat).trim()===''||String(lng).trim()==='')return null;
 lat=Number(lat);lng=Number(lng);
 return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=85&&Math.abs(lng)<=180?[lat,lng]:null;
}
function tiles(map,onError){return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'}).addTo(map).on('tileerror',onError);}
window.initStudioMap=()=>{
 const host=$('#studio-location-preview'),status=$('#studio-location-status');
 let preview=null,marker=null;
 if(window.L){
  preview=L.map(host,{scrollWheelZoom:false,dragging:false,touchZoom:false,doubleClickZoom:false,boxZoom:false,keyboard:false,zoomControl:false}).setView(center,10);
  tiles(preview,()=>{status.textContent='Map tiles could not load. Coordinates are still available below.';});
  new ResizeObserver(()=>preview.invalidateSize()).observe(host);
 }
 window.updateStudioMap=()=>{
  const selected=point($('#studio-latitude').value,$('#studio-longitude').value);
  status.textContent=selected?'Selected pin: '+selected.map(n=>n.toFixed(6)).join(', '):'No location selected. Open the map to place the studio pin.';
  if(!preview){status.textContent+=' The map library could not load.';return;}
  if(marker){preview.removeLayer(marker);marker=null;}
  preview.invalidateSize();
  preview.setView(selected||center,selected?16:10,{animate:false});
  if(selected)marker=L.marker(selected,{icon:icon(),interactive:false}).addTo(preview);
 };
 ['#studio-latitude','#studio-longitude'].forEach(id=>$(id).addEventListener('input',window.updateStudioMap));
 $('#pick-location').onclick=()=>window.openStudioMap({latitude:$('#studio-latitude').value,longitude:$('#studio-longitude').value,onSelect:(lat,lng)=>{
  $('#studio-latitude').value=lat.toFixed(6);$('#studio-longitude').value=lng.toFixed(6);window.updateStudioMap();
 }});
 window.updateStudioMap();
};
window.openStudioMap=({latitude,longitude,onSelect})=>{
 const dialog=$('#admin-dialog');let selected=point(latitude,longitude),map=null,marker=null,accuracy=null,disposed=false;
 $('#dialog-title').textContent='Pick Studio Location';
 $('#dialog-content').innerHTML='<p>Click the studio building or drag the pin to its entrance. Check that it matches the address and city in your form.</p><div id="location-map" class="location-picker" aria-label="Studio location map"></div><p id="map-status" class="map-status" role="status"></p><form id="location-form"><div class="map-coordinate-fields"><label>Latitude<input id="map-latitude" type="number" min="-85" max="85" step="any" required></label><label>Longitude<input id="map-longitude" type="number" min="-180" max="180" step="any" required></label></div><div class="map-footer"><button type="button" class="manager-button" id="map-current">Use My Location</button><button type="button" class="manager-button" id="map-cancel">Cancel</button><button type="submit" class="manager-button manager-primary">Use This Location</button></div></form>';
 const lat=$('#map-latitude'),lng=$('#map-longitude'),status=$('#map-status'),current=$('#map-current');
 if(selected){lat.value=selected[0].toFixed(6);lng.value=selected[1].toFixed(6);}
 status.textContent=selected?'Saved coordinates loaded. Move the pin only if needed.':'No pin selected. Click the exact studio location or enter its coordinates.';
 if(!dialog.open)dialog.showModal();
 function place(value,recenter=false){
  selected=value;
  if(accuracy&&map){map.removeLayer(accuracy);accuracy=null;}
  if(!map)return;
  if(!value){if(marker){map.removeLayer(marker);marker=null;}return;}
  if(marker)marker.setLatLng(value);
  else{
   marker=L.marker(value,{icon:icon(),draggable:true,autoPan:true,title:'Studio location: drag to adjust'}).addTo(map);
   marker.on('dragend',()=>{const p=marker.getLatLng().wrap();lat.value=p.lat.toFixed(6);lng.value=p.lng.toFixed(6);place(point(lat.value,lng.value));status.textContent='Pin updated. Confirm the studio entrance before using this location.';});
  }
  if(recenter)map.setView(value,Math.max(map.getZoom(),16),{animate:false});
 }
 if(window.L){
  map=L.map('location-map').setView(selected||center,selected?17:10);
  tiles(map,()=>{status.textContent='Map tiles could not load. Enter known coordinates or try again when online.';});
  place(selected);
  map.on('click',e=>{const p=e.latlng.wrap();lat.value=p.lat.toFixed(6);lng.value=p.lng.toFixed(6);place(point(lat.value,lng.value));status.textContent='Pin updated. Confirm the studio entrance before using this location.';});
  requestAnimationFrame(()=>{if(!disposed)map.invalidateSize();});
 }else status.textContent='Map could not load. Enter known coordinates below.';
 const resize=new ResizeObserver(()=>{if(map&&!disposed)map.invalidateSize();});resize.observe($('#location-map'));
 [lat,lng].forEach(input=>input.oninput=()=>{place(point(lat.value,lng.value),true);status.textContent=selected?'Pin matches the entered coordinates.':'Enter both valid coordinates to select a location.';});
 $('#map-cancel').onclick=()=>dialog.close();
 current.onclick=()=>{
  if(!navigator.geolocation){status.textContent='Location is unavailable. Click the map or enter coordinates.';return;}
  current.disabled=true;status.textContent='Finding your location...';
  navigator.geolocation.getCurrentPosition(p=>{
   if(disposed)return;current.disabled=false;
   const value=point(p.coords.latitude,p.coords.longitude);
   if(!value){status.textContent='Location is outside the supported map range.';return;}
   lat.value=value[0].toFixed(6);lng.value=value[1].toFixed(6);place(point(lat.value,lng.value),true);
   if(map)accuracy=L.circle(selected,{radius:p.coords.accuracy,color:'#ed3681',weight:1,fillOpacity:.12}).addTo(map);
   status.textContent='Device location accuracy: about '+Math.ceil(p.coords.accuracy)+' meters. Use this only if you are at the studio; adjust the pin if needed.';
  },()=>{if(disposed)return;current.disabled=false;status.textContent='Unable to get your location. Allow location access, click the map, or enter coordinates.';},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
 };
 $('#location-form').onsubmit=e=>{
  e.preventDefault();const value=point(lat.value,lng.value);
  if(!value){status.textContent='Select a location or enter both valid coordinates.';return;}
  onSelect(...value);dialog.close();
 };
 dialog.addEventListener('close',()=>{disposed=true;resize.disconnect();if(map)map.remove();},{once:true});
};
})();