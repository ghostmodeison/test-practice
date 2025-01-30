export default function Hero() {
    return (
        <div className="relative items-start flex justify-start h-screen bg-cover bg-center text-white xl:items-center "
            style={{ backgroundImage: "url('./promotion/background.png')" }}>
            <div className="text-center z-10lex flex-col items-start pl-[40px] pt-[12px] 2xl:pl-[141px]  xl:pl-[375px]">
                <div className="text-[80px] leading-[80px]  text-start font-semibold  xl:text-[80px] xl:leading-[90px] 2xl:text-[130px] 2xl:leading-[140px] ">
                    <div >
                        SHOWCASE
                    </div>
                    <div  >
                        NEGOTIATE
                    </div>
                    <div>
                        SELL
                    </div>
                </div>
                <div className="leading-[36px] text-[30px] text-start font-light xl:text-[30px] xl:leading-[60px] 2xl:text-[50px] " >
                    <div >You generate carbon credits.</div>
                    <div >
                        We help you sell them better.
                    </div>
                </div>
            </div>

        </div>
    );
}
