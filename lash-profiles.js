'use strict';
window.LashStyleProfiles=(()=>{
 const make=(description,options={})=>({description,count:88,fans:1,spread:.08,length:1,thickness:.57,variation:.18,shape:'natural',...options});
 const profiles={
 'Classic':make('Individual lashes with light, natural definition.',{legacy:'Classic'}),
 'Hybrid':make('Individual lashes mixed with soft, open fans.',{legacy:'Hybrid'}),
 'Wispy':make('An airy base with scattered longer spikes.',{fans:3,count:70,spikes:10,spikeLength:1.35}),
 'Volume':make('Soft, full fans with a rounded finish.',{fans:5,count:86,thickness:.38,variation:.12}),
 'Light Wispy':make('Light coverage with fine, separated wisps.',{count:58,fans:1,length:.93,spikes:9,spikeLength:1.3}),
 'Mascara Lash':make('Defined, narrow clusters with a mascara-like finish.',{count:58,fans:3,spread:.014,thickness:.57,variation:.13}),
 'Kitten Lash':make('A soft outer lift that tapers at the corner.',{shape:'kitten',length:.93,count:80}),
 'Hybrid Volume':make('A fuller hybrid blend with more open fans.',{fans:6,hybrid:true,count:96,thickness:.4,length:1.04}),
 'Mascara Volume':make('Fuller coverage with defined, narrow clusters.',{fans:5,spread:.018,count:80,thickness:.43,length:1.03}),
 'Russian Volume':make('Even, fine fans with a dense, rounded outline.',{fans:7,count:94,spread:.06,thickness:.31,variation:.07,shape:'doll'}),
 'Wispy Volume':make('Fluffy volume layered with taller, airy spikes.',{fans:5,count:87,thickness:.37,spikes:11,spikeLength:1.36}),
 'Wispy Cat Eye':make('An outer sweep with textured, longer wisps.',{shape:'cat',fans:3,count:76,thickness:.43,spikes:10,spikeLength:1.3}),
 'Cat Eye':make('Short inner lashes graduating to a longer outer sweep.',{shape:'cat',count:88}),
 'Dolleye':make('Longer in the center, tapering toward both corners.',{shape:'doll',count:90,length:1.06}),
 'Kylie (Wetlook)':make('Separated closed fans with taller wet-look spikes.',{fans:4,count:60,spread:.009,thickness:.5,spikes:11,spikeLength:1.35}),
 'DragLash (Mega Volume)':make('Dramatic fullness from many fine, layered fans.',{fans:10,count:104,spread:.065,thickness:.3,length:1.12,variation:.14}),
 'Strip Lash':make('Layered, crisscross strands with a subtle lash band.',{fans:4,count:78,thickness:.46,shape:'cat',cross:true,band:true,length:1.06}),
 'Anime Lash/Manua':make('Distinct long, pointed clusters over a short airy base.',{fans:2,count:58,thickness:.43,length:.68,spikes:8,spikeLength:2.0,spikeFans:5}),
 'Fox Eye':make('A low inner profile and pronounced outer flick.',{shape:'fox',count:88,fans:2,thickness:.48,sweep:.52})
 };
 profiles['Hybrid Lash']=profiles.Hybrid;
 const aliases={'Mega Volume':'DragLash (Mega Volume)','Doll Eye':'Dolleye','Dolly Eye':'Dolleye','Anime Lash':'Anime Lash/Manua'};
 const resolve=name=>profiles[name]||profiles[aliases[name]]||null;
 return {profiles,resolve,names:Object.keys(profiles)};
})();
