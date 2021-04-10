(function() {

/****************************
                  .----.
      .---------. | == |
      |.-"""""-.| |----|
      || O   O || | == |
      ||   U   || |----|
      |'-.....-'| |::::|
      `"")---(""` |___.|
     /:::::::::::\" _  "
    /:::=======:::\`\`\
    `"""""""""""""`  '-'
********* Hello! ***********/

getWeatherData = async() => {
    await fetch('https://www.7timer.info/bin/astro.php?lon=113.2&lat=23.1&ac=0&unit=metric&output=json&tzshift=0')
        .then(data => data.json())
        .then(data => {
            console.log(data)
        })

    console.log('end...')
}

getWeatherData()    

/****************************
                  .----.
      .---------. | == |
      |.-"""""-.| |----|
      || _   _ || | == |
      ||   o   || |----|
      |'-.....-'| |::::|
      `"")---(""` |___.|
     /:::::::::::\" _  "
    /:::=======:::\`\`\
    `"""""""""""""`  '-'
********** Bye! ************/

}())
