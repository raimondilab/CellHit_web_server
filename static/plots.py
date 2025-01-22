import static.clustergram as clu


# Draw clustergram
def clustergram(data, index_column="index", color_bar_title="ln(IC50)",
                tick_vals=None, height=500, width=500, auto_size=False, xpad=100, zmin=-3, zmax=3):

    # Drop rows with all NaN values and fill NaN with 0
    data = data.dropna(subset=data.columns[1:], how="all").fillna(0)

    # Sort the DataFrame
    data = data.sort_values(by=index_column, ignore_index=True).reset_index(drop=True)

    # Create the clustergram figure
    fig = clu.Clustergram(
        data=data,
        column_labels=list(data.columns[1:].values),
        row_labels=list(data[index_column]),
        height=height,
        width=width,
        color_map="RdBu_r",
        display_ratio=0.15,
        zmin=zmin,
        zmax=zmax,
        center_values=False,
        colorbar=dict(
            xpad=xpad,
            tickfont=dict(size=9),
            title=color_bar_title,
            xanchor="left",
            yanchor="middle",
            tickvals=tick_vals,  # Adjust tick values as needed
        ),
    )

    # Adjust font sizes for axes labels
    fig.update_xaxes(tickfont=dict(size=9))
    fig.update_yaxes(tickfont=dict(size=9))

    if auto_size:

        # Update the layout
        fig["layout"].update(
            autosize=True,
            yaxis=dict(automargin=True),
            xaxis=dict(automargin=True)
        )

        # Remove default image size
        fig["layout"].pop("height")
        fig["layout"].pop("width")


    # Convert the figure to JSON
    fig_json = fig.to_json(remove_uids=False)
    return fig_json
