/* VULCAN — mock-data.js · fixtures for the screen spec (labelled placeholders) */
window.OD_MOCK = {
  user:{ name:'Marcus', goal:'Cut · −0.5 kg/wk', streak:47 },
  today:{
    kcal:{ consumed:1380, target:2140 },
    macros:{ protein:{eat:146,goal:180}, carbs:{eat:142,goal:260}, fat:{eat:48,goal:68} },
    steps:{ count:10240, target:10000 },
    weight:{ v:82.4, delta:-0.6 },
    coach:'Heavy rack pulls at P meant leaving the last two reps short. Tempo the descent — the stretch is doing the work, not the bounce.'
  },
  weeklySteps:[8200,9400,7650,10800,9920,7850,10240],
  weightTrend:[76.2,76.0,75.8,75.9,75.5,75.2,75.4,75.1],
  weeklyVolume:[9420,11080,9640,12120,10480,12760,0],
  e1rm:[96,98.5,100,101.5,103,102.8,105],
  activeRoutine:{
    name:'Forge · Push Day', week:'Week 3 of 8', source:'AI',
    exercises:[
      {name:'Bench Press', sets:[
        {prev:'60 × 8', kg:'60', reps:'8', rpe:'8', done:true},
        {prev:'60 × 8', kg:'60', reps:'8', rpe:'8.5'},
        {prev:'60 × 8', kg:'', reps:'', rpe:''}
      ]},
      {name:'Overhead Press · superset', superset:'#FFB347', sets:[
        {prev:'35 × 10', kg:'35', reps:'10', rpe:'7.5'},
        {prev:'35 × 10', kg:'35', reps:'10', rpe:'8'}
      ]}
    ]
  },
  restSeconds:120,
  quota:{ used:2, total:5 }
};