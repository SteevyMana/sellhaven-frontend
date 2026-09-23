function StatCard({
    title,
    value,
    color = "#0f172a"
}) {

    return (

        <div
            className="card border-0 shadow-sm h-100"
            style={{
                borderRadius: "18px"
            }}
        >

            <div className="card-body">

                <h6 
                    className="text-nowrap"
                    style={{
                        color: "#64748b",
                        marginBottom: "10px",
                        fontWeight: "500"
                    }}
                >
                    {title}
                </h6>

                <h2
                    style={{
                        color: color,
                        fontWeight: "700",
                        fontSize: "clamp(16px, 2.2vw, 26px)",
                        wordBreak: "break-word",
                        margin: 0
                    }}
                >
                    {value}
                </h2>

            </div>

        </div>
    );
}

export default StatCard;