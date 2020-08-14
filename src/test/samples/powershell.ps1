
# Convert any text file to ASCII

param( [string] $infile = $(throw "Please specify a filename.") ) 

$outfile = "$infile.ascii" 

get-content -path $infile | out-file $outfile -encoding ascii

# ! Comment here
# ? Another comment
# ^ Some other comment
# * Highlighted comment

<# 
& Hello world
~ Hello world
// Hello world
#>