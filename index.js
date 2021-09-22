const express = require('express');
const app = express();
const port = 8888;

// app.METHOD(PATH, HANDLER)




app.get('/', (req, res)=> {
    const data = {
        name: 'Hello',
        isAwesome: true
    };

    res.json(data);
});


app.get('/awesome-generator', (req, res)=>{
    const { name, isAwesome } = req.query;
    res.send(`${name} is ${JSON.parse(isAwesome) ? 'really' : 'NOT'} awesome.`);
})


app.listen(port, () =>{
    console.log(`Express App listening at http://localhost:${port}`);
});