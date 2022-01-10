import json
import csv
import sys

output = []

with open(sys.argv[1]) as fle:
    f = csv.DictReader(fle)
    for line in f:
        if int(line['tokens']) > 0:
            obj = {}
            obj['account'] = line['wallet']
            obj['amount'] = str(int(line['tokens']) * pow(10,18))

            output.append(obj)

dump = json.dumps(output)

with open(sys.argv[2] + '.json', 'w') as fle:
    fle.write(dump)