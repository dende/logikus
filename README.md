logikus
=======

Simulator of the german toy computer logikus.

The current state of the Logikus can be saved when pressing "s". The connections will be printed via console.log.

To load a state press "l" and enter a connection in the following format:

{node_1: node_2, node_3: node_4}

A connection will be made between node_1 and node_2 on the patchbay

The node format is a 3-4 characters long string built like this:

yxj(i)

y can be "X" to select the upper row or A-K to select the rows on the patchbay
x can be "X" to select the left column only containing the source, or 0-9 to select any other column
j can be "l"("left"), "m"("middle") or "r"("right") when y is X("upper row") or "a" or "b" for either the left or right connection when on the patchbay
i is not specified for the upper row, but indicates the vertical position of the connection on the node on the patchbay. can be either "o", "m" or "u" for "oben"("upper"), "mitte"("middle") or "unten"("lower") connection

after loading this state for example you can convert one digit decimal numbers to binary numbers with the logikus:
'{"XXr":"A1ao","X3r":"A8bo","X4r":"A4bo","X5l":"A2bo","X5r":"C6bu","X6r":"C9bm","A1bm":"C3bm","A1au":"A2am","A2bm":"A3bo","A2au":"A3am","A3ao":"C3ao","A3au":"A4am","A4bm":"A5bo","A4au":"A5am","A4bu":"A7bu","A5ao":"C5ao","A5bm":"A6bo","A5au":"A6am","A6ao":"C6ao","A6bm":"A7bo","A6au":"A7am","A7ao":"C7ao","A7au":"A8am","A8bm":"A9bo","A8au":"A9am","A9ao":"C9ao","C3bu":"C5bm","C5bo":"E7bu","C6bo":"C7bo","C7au":"E7ao","C9bu":"E7bo"}'
