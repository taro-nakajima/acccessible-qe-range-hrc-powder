//JavaScript code for calculating accessible Q-E ranges at HRC for powder samples
const version = "1.0";
const Ei_numMax=5;
var Ei = new Array(Ei_numMax);
const decimal_digit = 1000;
var isOptimumEi= (new Array(Ei_numMax)).fill(true);

const DetBankNum = 4;
var tth_max;
var tth_min;

const eps=1e-6;

const marginX = 50;
const marginY = 20;

const TOFscale = 10.0;    // ms to pixel
const Lscale=10.0;        // meter to pixel

var Qrange_in_ki_unit = 1.2;    // the maximum of horizontal axis of the Q-E map is ki*Qrange_in_ki_unit
var Ef_min_in_ki_unit = 0.1;    // 
var Ef_max_in_ki_unit = 1.4;    // 
var OriginX = 50;     // X origin of the Q-E map
var OriginY = 270;    // y origin of the Q-E map

var Ltotal_R;
var Lsc_R; 
var L1_R;
var LT0_R;
var TOF_len_R;
var Ltotal;
var Lsc;
var L1;
var LT0;
var TOF_len;

var T0_Chop_Const = 77.0/(2.0*Math.PI*300.0)*1000;     // (ms/Hz) cited from S. Itoh et al. Nuc. Inst. Methods in Phys. Research A61 86-92 (2012).

const TOFconst = 2.286;       // TOF at 1 m is 2.286/sqrt(E)
var upperLimitEi = 8000;    // upper limit of Ei 8eV

const TextSize = 12;      // pixel


function draw() {

    init();

    draw_TOF();

    //draw_Qxy();

    drawQELineCuts();
}

function init(){

    document.getElementById("verNum").innerHTML=version;
    document.getElementById("verNum2").innerHTML=version;

    const inputL1 = Number(document.getElementById('input_L1').value);
    const inputL2 = Number(document.getElementById('input_L2').value);
    const inputL3 = Number(document.getElementById('input_L3').value);
    const inputLT0 = Number(document.getElementById('input_LT0').value);

    Ltotal_R = inputL1+inputL2;      // Real source to detector (m)
    Lsc_R = inputL1-inputL3;        // Real source chopper distance  (m)
    L1_R = inputL1;          // Real source to sample distance (m)
    LT0_R = inputLT0;        // Real source to T0 distance (m)
    TOF_len_R = 40;       // Real TOF max (ms)

    Ltotal=Ltotal_R*Lscale;
    Lsc = Lsc_R*Lscale;
    L1 = L1_R*Lscale;
    LT0 = LT0_R*Lscale; 
    TOF_len = TOF_len_R*TOFscale;

    tth_max = Number(document.getElementById('tth_max').value);
    tth_min = Number(document.getElementById('tth_min').value);

}

function draw_TOF(){

    var ChopperOpen = 4;    // pixel


    var TickL = 8;

    var TOF_at_Chopper = new Array(50);

    //get elements from the document
    var canvas2 = document.getElementById('CanvasTOF');
    var context2 = canvas2.getContext('2d');

    var chopperFace = Boolean(Number(document.getElementById('chopperFace').value));

    var freq = Number(document.getElementById('freq').value);
    var ChopPeriod_R = 1.0/freq*1000.0;       //Real chopper period (ms). Although a factor "1/2" is necessary for Fermi choppers with straight slits, the chopper of HRC has curved slits. So 1/2 is not necessary.
    var ChopPeriod = ChopPeriod_R*TOFscale;
    var ChopRept = TOF_len_R/ChopPeriod_R;

    var T0_freq = Number(document.getElementById('T0_freq').value);
    var T0ChopPeriod_R = 1.0/T0_freq*1000.0/2;    //Real T0 chopper period (ms). A factor "1/2" is necessary for a symmetric rotor.
    var T0ChopPeriod = T0ChopPeriod_R*TOFscale;
    var T0ChopRept = TOF_len_R/T0ChopPeriod_R;
    var T0_Blind_R = T0_Chop_Const/T0_freq;
    var T0_Blind = T0_Blind_R*TOFscale;

    var TargetEi = Number(document.getElementById('targetEi').value);
    var TargetTOF_at_Chopper=(TOFconst*(Lsc_R)/Math.sqrt(TargetEi));

    upperLimitEi = Number(document.getElementById('upperLimitEi').value);

    var ChopOfst_R =0;      //Real chopper offset (ms)

//    var isOptimumWindow = new Array(ChopRept);

    for (var tt=0;tt<=ChopRept;tt+=1){
        var t1=(tt)*ChopPeriod_R;
        var t2=(tt+1.0)*ChopPeriod_R;

        if ((TargetTOF_at_Chopper > t1) && (TargetTOF_at_Chopper <= t2) ){
            ChopOfst_R=TargetTOF_at_Chopper-t1;
        }
    }

    var displayChopperOfst = ChopOfst_R;
    if (chopperFace == true){
        displayChopperOfst +=0;
    }
    else {
        displayChopperOfst += ChopPeriod_R/2.0;       // Another half rotation is necessary to have optimum condition for the target Ei
    }

    document.getElementById('offset').value=Math.round(displayChopperOfst*decimal_digit)/decimal_digit;

    var ChopOfst = ChopOfst_R*TOFscale;

    var temp = document.getElementById('Ei_Num_ofst');
    var Ei_num_ofst = Number(temp.value);


    //refresh
    context2.clearRect(0, 0, canvas2.width, canvas2.height);
    context2.strokeStyle = "rgb(0, 0, 0)";
    context2.lineWidth=1;


    //text labels
    context2.font = "italic 10px sans-serif";
    context2.fillText("Chopper", 1, marginY+(Ltotal-Lsc)+TextSize/2);
    context2.fillText("Sample", 1, marginY+(Ltotal-L1)+TextSize/2);
    context2.fillText("Source", 1, marginY+(Ltotal)+TextSize/2);
    context2.fillText("Detector", 1, marginY+TextSize/2);
    context2.fillText("T0 Ch.", 1, marginY+(Ltotal-LT0)+TextSize/2);


    // x axis
    context2.beginPath();
    context2.moveTo(marginX, (Ltotal)+marginY);
    context2.lineTo(marginX, marginY);
    context2.stroke();

    // x ticks
    context2.font = " 10px sans-serif";
    for (var i=0;i<5;i+=1){
        context2.beginPath();
        context2.moveTo(marginX+TOF_len/4*i, marginY+Ltotal);
        context2.lineTo(marginX+TOF_len/4*i, marginY+Ltotal-TickL);
        context2.stroke();
        context2.fillText(i*10, marginX+TOF_len/4*i-TextSize/2, marginY+Ltotal+TextSize*1.5);
    }

    // x label
    context2.fillText("Time (ms)", marginX+TOF_len/2-TextSize, marginY+Ltotal+TextSize*3);

    // y axis
    context2.beginPath();
    context2.moveTo(marginX, Ltotal+marginY);
    context2.lineTo(marginX+TOF_len, Ltotal+marginY);
    context2.stroke();

    // sample position
    context2.strokeStyle = "rgb(180, 180, 180)";
    context2.beginPath();
    context2.moveTo(marginX, Ltotal+marginY-L1);
    context2.lineTo(marginX+TOF_len, Ltotal+marginY-L1);
    context2.stroke();

    // det position
    context2.strokeStyle = "rgb(180, 180, 180)";
    context2.beginPath();
    context2.moveTo(marginX, marginY);
    context2.lineTo(marginX+TOF_len, marginY);
    context2.stroke();


    //Fermi chopper
    context2.lineWidth=4;
    context2.strokeStyle = "rgb(100, 100, 100)";
    context2.beginPath();
    context2.moveTo(marginX, Ltotal+marginY-Lsc);
    context2.lineTo(marginX-ChopperOpen/2+ChopOfst, Ltotal+marginY-Lsc);
    context2.stroke();
    TOF_at_Chopper[0]=(ChopOfst_R);    

    for (var i = 1; i < ChopRept; i += 1) {
        context2.beginPath();
        context2.moveTo(marginX+ChopPeriod*(i-1)+ChopperOpen/2+ChopOfst, Ltotal+marginY-Lsc);
        context2.lineTo(marginX+ChopPeriod*(i)-ChopperOpen/2+ChopOfst, Ltotal+marginY-Lsc);
        context2.stroke();
        TOF_at_Chopper[i]=(ChopPeriod_R*(i)+ChopOfst_R);    
    }

    // Determine Ei num offset
    Ei_num_ofst=0;
    for (var i=0;i<ChopRept;i+=1){
        var testE =(TOFconst/TOF_at_Chopper[i]*(Lsc_R))**2.0 ;
        if (testE > upperLimitEi){
            Ei_num_ofst += 1;
        }    
    }
    document.getElementById('Ei_Num_ofst').value=Ei_num_ofst;

    for(var i=0;i<Ei_numMax;i+=1){
        var idE='E'+(i+1);
        document.getElementById(idE).value = Math.round((TOFconst/TOF_at_Chopper[Ei_num_ofst+i]*(Lsc_R))**2.0*decimal_digit)/decimal_digit ;
        Ei[i]=(TOFconst/TOF_at_Chopper[Ei_num_ofst+i]*(Lsc_R))**2.0 ;
    }


    //T0 chopper
    for (i=0;i<Ei_numMax;i+=1){
        isOptimumEi[i]=true;
    }
    context2.lineWidth=6;
    context2.strokeStyle = "rgb(100, 100, 100)";
    context2.beginPath();
    context2.moveTo(marginX, Ltotal+marginY-LT0);
    context2.lineTo(marginX+T0_Blind, Ltotal+marginY-LT0);
    context2.stroke();
    var T0_blind_start = 0;
    var T0_blind_end = T0_Blind_R;
    var TOF_at_T0 = TOF_at_Chopper[Ei_num_ofst]/Lsc*LT0;
    if(TOF_at_T0>T0_blind_start && TOF_at_T0<T0_blind_end){
        isOptimumEi[0]=false;
    }

//

    for (var i = 1; i <= T0ChopRept; i += 1) {
        context2.beginPath();
        context2.moveTo(marginX+T0ChopPeriod*(i)-T0_Blind, Ltotal+marginY-LT0);
        context2.lineTo(marginX+T0ChopPeriod*(i)+T0_Blind, Ltotal+marginY-LT0);
        context2.stroke();
        T0_blind_start = T0ChopPeriod_R*(i)-T0_Blind_R;
        T0_blind_end = T0ChopPeriod_R*(i)+T0_Blind_R;

        for (var j=0;j<Ei_numMax;j+=1){
            TOF_at_T0 = TOF_at_Chopper[Ei_num_ofst+j]/Lsc*LT0;
            if(TOF_at_T0>T0_blind_start && TOF_at_T0<T0_blind_end){
                isOptimumEi[j]=false;
            }

        }
    }
//


    //Lines for each Ei
    context2.lineWidth=1;
    for (var i = 0; i < Ei_numMax; i += 1) {
        if (isOptimumEi[i]==true){
            context2.strokeStyle = "rgb(255, 0, 0)";
            context2.lineWidth=2;
        }
        else {
            context2.strokeStyle = "rgb(255, 150, 150)";
            context2.lineWidth=1;
        }
        context2.beginPath();
        context2.moveTo(marginX, marginY+Ltotal);
        context2.lineTo(marginX+TOF_at_Chopper[Ei_num_ofst+i]*TOFscale*Ltotal/Lsc, marginY);
        context2.stroke();
    }
    context2.lineWidth=1;


    for (var j=0;j<Ei_numMax;j+=1){
        var labelEicalc='E'+(Math.round(1+j))+'_calc';
        document.getElementById(labelEicalc).innerHTML = Math.round(Ei[j]*decimal_digit)/decimal_digit;
    }
}

function drawQELineCuts() {

    let canvas4 = new Array(Ei_numMax);
    let context4 = new Array(Ei_numMax);

    Qrange_in_ki_unit=Number(document.getElementById("Q_max").value);
    Ef_min_in_ki_unit=Number(document.getElementById("Ef_min").value);
    Ef_max_in_ki_unit=Number(document.getElementById("Ef_max").value);

    for(var ii=0;ii<Ei_numMax;ii+=1){
        var canvasName='CanvasQE'+(Math.round(ii+1));
        canvas4[ii] = document.getElementById(canvasName);
        context4[ii] = canvas4[ii].getContext('2d');    
    }

    let ki = new Array(Ei_numMax);
    for (var j=0;j<Ei_numMax;j+=1){
        ki[j]=Math.sqrt(Ei[j]/2.072);
    }


    for(var ii=0;ii<Ei_numMax;ii+=1){   // for loop for five Eis.
        //refresh
        context4[ii].clearRect(0, 0, canvas4[ii].width, canvas4[ii].height);
        context4[ii].strokeStyle = "rgb(0, 0, 0)";
        context4[ii].lineWidth=1;

        let Ystep=canvas4[ii].height
        context4[ii].beginPath();
        context4[ii].lineWidth=1;
        let isFirstPoint=true;

        Q_max = ki[ii]*Qrange_in_ki_unit;

        for(var jj=0;jj<=Ystep;jj+=1){
            var Ef=Ef_max_in_ki_unit*Ei[ii]-((Ef_max_in_ki_unit-Ef_min_in_ki_unit)*Ei[ii])/Ystep*jj;
            var kf = Math.sqrt(Ef/2.072);
            var Q = Math.sqrt(ki[ii]**2.0+kf**2.0-2.0*ki[ii]*kf*Math.cos(Math.PI/180.0*tth_min));

            if(isFirstPoint==true){
                context4[ii].moveTo(OriginX+Q/Q_max*(canvas4[ii].width-OriginX), canvas4[ii].height-jj*1);
                isFirstPoint=false;
            }
            else{
                context4[ii].lineTo(OriginX+Q/Q_max*(canvas4[ii].width-OriginX), canvas4[ii].height-jj*1);
            }    
        }

        for(var jj=Ystep;jj>=0;jj-=1){
            var Ef=Ef_max_in_ki_unit*Ei[ii]-((Ef_max_in_ki_unit-Ef_min_in_ki_unit)*Ei[ii])/Ystep*jj;
            var kf = Math.sqrt(Ef/2.072);
            var Q = Math.sqrt(ki[ii]**2.0+kf**2.0-2.0*ki[ii]*kf*Math.cos(Math.PI/180.0*tth_max));

            if(isFirstPoint==true){
                context4[ii].moveTo(OriginX+Q/Q_max*(canvas4[ii].width-OriginX), canvas4[ii].height-jj*1);
                isFirstPoint=false;
            }
            else{
                context4[ii].lineTo(OriginX+Q/Q_max*(canvas4[ii].width-OriginX), canvas4[ii].height-jj*1);
            }    
        }
        context4[ii].fillStyle="rgb(220, 230, 250)";
        context4[ii].fill();
        context4[ii].strokeStyle="rgb(0, 0, 250)";
        context4[ii].stroke();

        context4[ii].fillStyle="rgb(0, 0, 0)";
        context4[ii].beginPath();
        context4[ii].strokeStyle="rgb(150, 150, 150)";
        context4[ii].lineWidth=1;
        context4[ii].moveTo(OriginX,canvas4[ii].height);
        context4[ii].lineTo(OriginX,0);
        context4[ii].stroke();


        OriginY=canvas4[ii].height*(1.0-Ef_min_in_ki_unit)/((Ef_max_in_ki_unit-1) + (1.0-Ef_min_in_ki_unit));

        context4[ii].beginPath();
        context4[ii].moveTo(OriginX,OriginY);
        context4[ii].lineTo(OriginX+canvas4[ii].width,OriginY);
        context4[ii].stroke();

        // x ticks
        context4[ii].font = " 12px sans-serif";
        let EthickBar=5;
        let Espacing=20;
        let Qspacing=0.5;
        if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>100){
            Espacing=50;
        }
        else if (Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>50){
            Espacing=10;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>20){
            Espacing=5;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>10){
            Espacing=2;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>5){
            Espacing=1;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>2){
            Espacing=0.5;
        }
        else if(Ei[ii]*((Ef_max_in_ki_unit-1) +(1.0-Ef_min_in_ki_unit))>1){
            Espacing=0.2;
        }
        else {
            Espacing=0.1;
        }

        if(Q_max>10){
            Qspacing=2;
        }
        else if (Q_max>5){
            Qspacing=1;
        }
        else if(Q_max>2){
            Qspacing=0.5;
        }
        else if(Q_max>1){
            Qspacing=0.5;
        }
        else if(Q_max>0.5){
            Qspacing=0.2;
        }
        else if(Q_max>0.1){
            Qspacing=0.05;
        }
        else {
            Qspacing=0.2;
        }

        let Escale = ((Ef_max_in_ki_unit-Ef_min_in_ki_unit)*Ei[ii])/canvas4[ii].height;  // energy (meV) per pixel
        let Qscale = Q_max/(canvas4[ii].width-OriginX); 

        context4[ii].font = "12px sans-serif";
        // tick marks for y(energy)axis
        for (let i=-10;i<20;i+=1){
            context4[ii].beginPath();
            context4[ii].moveTo(OriginX, OriginY-Espacing/Escale*i);
            context4[ii].lineTo(OriginX+EthickBar, OriginY-Espacing/Escale*i);
            context4[ii].stroke();
            let txt_ofst_x=TextSize;
            if(i*Espacing>=100){
                txt_ofst_x=TextSize*2.5;
            }
            else if (i*Espacing>=10){
                txt_ofst_x=TextSize*2;
            }
            else if (i*Espacing>=1){
                txt_ofst_x=TextSize*1.5;
            }
            else if (i*Espacing>0){
                txt_ofst_x=TextSize*2;
            }
            else if (i*Espacing< -100){
                txt_ofst_x=TextSize*4;
            }
            else if (i*Espacing<= -10){
                txt_ofst_x=TextSize*3;
            }
            else if (i*Espacing< 0){
                txt_ofst_x=TextSize*2;
            }
            else if (i== 0){
                txt_ofst_x=TextSize*1.5;
            }

            if (Espacing< 1){
                txt_ofst_x+=TextSize;
            }

            context4[ii].fillText(Math.round(i*Espacing*decimal_digit)/decimal_digit,OriginX-txt_ofst_x, OriginY-Espacing/Escale*i+TextSize/2);
        }
        //*/
        // tick marks for x(q)axis
        let qTickBar=10;
        let QtickSpan=Qspacing/Qscale;
        for (let i=1;i<10;i+=1){
            context4[ii].beginPath();
            context4[ii].moveTo(OriginX+QtickSpan*i, OriginY-qTickBar/2);
            context4[ii].lineTo(OriginX+QtickSpan*i, OriginY+qTickBar/2);    
            context4[ii].stroke();
            context4[ii].fillText(Math.round(i*Qspacing*decimal_digit)/decimal_digit,OriginX+QtickSpan*i-TextSize/2, OriginY+TextSize*2);
        }

        context4[ii].font = "14px sans-serif";
        const padding1=10;
        context4[ii].fillText('E (meV)',OriginX+padding1, TextSize*2);
        context4[ii].fillText('Q (A-1)',canvas4[ii].width-OriginX, OriginY-TextSize*1);

        ///horizontal bars showing the target energies
        for(j=1;j<=12;j+=1){
            var label_targetE = 'Et_'+Math.round(j);
            if(document.getElementById(label_targetE).value){
                var targetE = Number(document.getElementById(label_targetE).value);
                context4[ii].beginPath();
                context4[ii].strokeStyle="rgb(255, 0, 0)";
                context4[ii].fillStyle="rgb(255, 0, 0)";
                context4[ii].lineWidth=1;
                context4[ii].moveTo(OriginX, OriginY-targetE/Escale);
                context4[ii].lineTo(canvas4[ii].width-OriginX-TextSize*2, OriginY-targetE/Escale);    
                context4[ii].fillText(Math.round(targetE*decimal_digit)/decimal_digit+" meV",canvas4[ii].width-OriginX-TextSize*1.5, OriginY-targetE/Escale+TextSize/2);
                context4[ii].stroke();
            }
        }

        ///vertical bars showing the target energies
        for(j=1;j<=12;j+=1){
            var label_targetQ = 'Qt_'+Math.round(j);
            if(document.getElementById(label_targetQ).value){
                var targetQ = Number(document.getElementById(label_targetQ).value);
                context4[ii].beginPath();
                context4[ii].strokeStyle="rgb(0, 200, 0)";
                context4[ii].fillStyle="rgb(0, 200, 0)";
                context4[ii].lineWidth=1;
                context4[ii].moveTo(OriginX+targetQ/Qscale, canvas4[ii].height);
                context4[ii].lineTo(OriginX+targetQ/Qscale, TextSize);    
                context4[ii].fillText(Math.round(targetQ*decimal_digit)/decimal_digit+" A-1",OriginX+targetQ/Qscale-TextSize, TextSize);
                context4[ii].stroke();
            }
        }
        
    }   // end of for-loop for five Eis


}

