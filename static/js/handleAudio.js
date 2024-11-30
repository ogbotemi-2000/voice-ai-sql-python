(function(w) {

  let worker, tainted, url='upload', audioCtx, mediaR, _chunks=[], chunks=[], audio, fReader = new FileReader(), canvas, isFirst,
  sqlRgx = SQL_KEYWORDS_REGEX;

  w_Ev_dom(function() {
    /** legacy code: window.<element.id> obtain reference to node via its id, conveinent but may be frowned upon  */
    canvas  =  window.visualize
    // .transferControlToOffscreen(),
    // (worker = new Worker("/static/js/worker.js")).postMessage({ canvas }, [canvas])
  })

  function Aud(_audio) {
    return new Promise((res, rej)=>{
     /*prevent multiple calls after very first or when the required object is not available*/
      if(Aud.inited) { return res(true/*avoid redundancy*/);}
      if(!navigator.mediaDevices.getUserMedia) return rej(true/*give up trying to retry by not setting Audio.inited to false in catch clause*/, 'Try a modern browser for this feature');

      navigator.mediaDevices.getUserMedia({ echoCancellation:true, audio: true }).then(_stream=>{
        Aud.inited=!0, audio = _audio,
        onSuccess(_stream, res)/*resolve the promise in this function to ensure that mediaR is defined by `.then(...)` [^_^ pun absolutely intended]*/
      }, err=>rej(null, 'Connect a microphone, earphone, etc. to record audio'))
    })
  }

  function onSuccess(_stream, res, options) {
    Aud.bitRate && (options = {audioBitsPerSecond: Aud.bitRate}),
    (mediaR = new MediaRecorder(_stream, options)).onstop=_=>{
      audio.src = stream(_stream), Aud.inited = null
    }, res(),
    Aud.fxns = [_=>mediaR.start(), _=>mediaR[mediaR.state==='paused'?'resume':'pause'](), _=>mediaR.stop()],
    mediaR.ondataavailable=e=>{
      _chunks.push(e.data)
    }
    /*commented out because visualizing the recording made the browser forgo the recording to focus on it*/
    //, visualize(_stream)
  }

  function stream(_stream) {
    /*Use chunks in lieu of _chunks if there was a network disconnect which tainted _chunks when streaming it*/
    let blob = new Blob(/*tainted?chunks:*/_chunks, { type: mediaR.mimeType }),
        apiKey = window.assemblyKey;
    apiKey&&(apiKey=apiKey.value), /*clear streamed _chunks*/ _chunks = [],
    fReader.onload=_=>{
      let bs64 = fReader.result,
          data = {...apiKey&&{apiKey}, recording:bs64.split('base64,')[1]};
      console.log('::DATA::', data),
      /** stop the stream after streaming it to remove the recording icon and ensure all recordings are readAsDataURL prior */
      _stream.getAudioTracks().forEach(function(track) {
        track.stop();
      }),
      fetch('/upload', {
        method:'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(data)
      }).then(res=>res.json()).then(res=>{
        /** remove shown error notifications */
        Abbr.to(voiceError,'cL').replace('show','absolute'),
        /** to clear the outpane of the SQL queries the first time this is done */
        isFirst||=!(window.queries.textContent='');
        let intel=window.intelligence.innerText.trim().split(/\n/).filter(e=>e),
        { text:txt } = res, even = N(intel.length,0,2);

        /**Because the AI may infer punctuation marks from diction and pauses, remove the ones recongnized in the inferred text because they will lead to syntax errors in SQL*/
        even.forEach(e=>txt = txt.replace(new RegExp('\\'+intel[e], 'g'), '')),
        /** now replace each word with the symbol it spells */
        even.forEach((e, i)=>txt = txt.replace(new RegExp(intel[e+1], 'i'), intel[e])),
        /** convert SQL keywords to upper case */
        txt = txt.replace(sqlRgx, m=>m.toUpperCase()),
        txt = hljs.highlight(txt+'\n', {language:'sql'}).value,
        Aud.streaming ? queries.innerHTML+=txt : queries.innerHTML = txt, console.log('::RESPONSE::', res)
      }).catch(_=>{
        Abbr.to(voiceError,'fEC').textContent = "Error in speech-to-text server's response",
        Abbr.to(voiceError,'cL').replace('absolute','show')
      })
    },
    fReader.readAsDataURL(blob);
    return URL.createObjectURL(blob)
  }
  
  function visualize(stream) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let source = audioCtx.createMediaStreamSource(stream),
    analyser = audioCtx.createAnalyser();
    source.connect(analyser), analyser.connect(audioCtx.destination), analyser.fftSize=128;

    let bufferLength = analyser.frequencyBinCount,
        dataArray    = new Uint8Array(bufferLength);
        canvasCtx    = canvas.getContext('2d'), monit=0;
 
    (function draw() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);
    ++monit>1000&&(canvasCtx.clearRect(0, 0, WIDTH, HEIGHT), monit=0);

    canvasCtx.fillStyle = "rgb(255, 255, 255)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasCtx.beginPath();

    let sliceWidth = (WIDTH * 1.0) / bufferLength;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = (v * HEIGHT) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  })()
  /** The code for visualization below is replaced with the one above because it is CPU-intensive, despite being in a worker, enough to halt
   * the browser's ability to stream recorded audio
    */
  // (function animate() {
  //   analyser.getByteFrequencyData(dataArray),
  //   worker.postMessage({ bufferLength, dataArray }, {}),
  //   requestAnimationFrame(animate)
  // })()
  }
  w.Aud = Aud
})(window)