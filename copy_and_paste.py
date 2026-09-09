input = open("input.txt", "r")
output = open("output.txt", "w")

# No page may be longer than 14 lines, and each line can have a width of 114 pixels

TWO_PIXELS = {'i', '.', ',', ':', ';', '!', '|', '\''}
THREE_PIXELS = {'l', '`'}
FOUR_PIXELS = {'I', 't', '(', ')', '{', '}', '[', ']', '<', '>', '*'}
FIVE_PIXELS = {'k', 'f'}
SIX_PIXELS = {'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'g', 'h', 'j', 'm', 'n', 'o', 'p', 'q', 'r', 's', 'u', 'v', 'w', 'x', 'y', 'z', '#', '$', '%', '^', '&', '/', '\\'}
SEVEN_PIXELS = {'@', '~'}
SPACE = ' '

page_count = 1
line_count = 1
pixel_count = 0

output.write("PAGE 1\n\n")

def out(pixels, word):
    global pixel_count, line_count, page_count
    
    space = 4 if pixel_count > 0 else 0
    needed = space + pixels

    if pixel_count + needed <= 114:
        if pixel_count > 0:
            output.write(" ")
        pixel_count += needed
        output.write(word)
    elif line_count < 14:
        output.write("\n")
        pixel_count = pixels
        line_count += 1
        output.write(word)
    else:
        output.write("\n")
        pixel_count = pixels
        line_count = 1
        page_count += 1
        output.write("\nPAGE " + str(page_count) + "\n\n")
        output.write(word)

def new_paragraph():
    global pixel_count, line_count, page_count
    print("new paragraph")
    if line_count >= 13:
        pixel_count = 0
        line_count = 0
        page_count += 1
        output.write("\n\nPAGE " + str(page_count) + "\n\n")
    else:
        output.write("\n\n")
        line_count += 2
        pixel_count = 0

def count_word_pixels(word):
    pixels = 0
    for char in word:
        if char in TWO_PIXELS:
            pixels += 2
        elif char in THREE_PIXELS:
            pixels += 3
        elif char in FOUR_PIXELS:
            pixels += 4
        elif char in FIVE_PIXELS:
            pixels += 5
        elif char in SIX_PIXELS:
            pixels += 6
        elif char in SEVEN_PIXELS:
            pixels += 7
        else:
            pixels += 6
    return pixels

for line in input:           
    for w in line.split():
        pixels = count_word_pixels(w)
        out(pixels, w)
    new_paragraph()

input.close()
output.close()